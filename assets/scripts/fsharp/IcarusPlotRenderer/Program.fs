// IcarusPlotRenderer
// Self-contained F# renderer for the MISSION-ICARUS visualization suite.
//
// Contract:
//   argv[1] = path to a JSON payload file
//   payload shape: { "plotType": string, "payload": <plot payload> }
//   emits: a Plotly figure JSON document on stdout
//          { "data": [<traces>], "layout": {...}, "config": {...} }
//          which plotly.js can consume directly (newPlot / toImage 'svg').
//
// Supported plotType values: "bar" | "box" | "scatter" | "heatmap" | "volcano" | "pca"
//
// Chart construction uses Plotly.NET; statistical calculations use FSharp.Stats.

module IcarusPlotRenderer

open System
open System.Globalization
open System.IO
open System.Text
open System.Text.Json
open System.Text.Json.Nodes
open Plotly.NET
open Plotly.NET.TraceObjects
open FSharp.Stats

let culture = CultureInfo.InvariantCulture
let isFin = fun (v: float) -> not (Double.IsNaN v) && not (Double.IsInfinity v)

// ---------------------------------------------------------------------------
// JSON helpers
// ---------------------------------------------------------------------------
let tryProp (el: JsonElement) (name: string) : JsonElement option =
    let ok, x = el.TryGetProperty(name)
    if ok then Some x else None

let tryNumber (el: JsonElement) : float option =
    match el.ValueKind with
    | JsonValueKind.Number ->
        let mutable d = 0.0
        if el.TryGetDouble(&d) then Some d else None
    | JsonValueKind.String ->
        let parsed, d = Double.TryParse(el.GetString(), NumberStyles.Float, culture)
        if parsed then Some d else None
    | _ -> None

let getNumber (el: JsonElement) (name: string) (fallback: float) : float =
    match tryProp el name |> Option.bind tryNumber with
    | Some v when isFin v -> v
    | _ -> fallback

let getStringDef (el: JsonElement) (name: string) (fallback: string) : string =
    match tryProp el name with
    | Some x when x.ValueKind = JsonValueKind.String ->
        let s = x.GetString()
        if String.IsNullOrEmpty s then fallback else s
    | _ -> fallback

let getBool (el: JsonElement) (name: string) (fallback: bool) : bool =
    match tryProp el name with
    | Some x when x.ValueKind = JsonValueKind.True -> true
    | Some x when x.ValueKind = JsonValueKind.False -> false
    | _ -> fallback

let getInt (el: JsonElement) (name: string) (fallback: int) : int =
    getNumber el name (float fallback) |> int

let getStringArray (el: JsonElement) (name: string) : string list =
    match tryProp el name with
    | Some x when x.ValueKind = JsonValueKind.Array ->
        x.EnumerateArray()
        |> Seq.map (fun it ->
            match it.ValueKind with
            | JsonValueKind.String -> it.GetString()
            | JsonValueKind.Number -> string (tryNumber it |> Option.defaultValue 0.0)
            | _ -> "")
        |> Seq.toList
    | _ -> []

let getFloatList (el: JsonElement) (name: string) : float list =
    match tryProp el name with
    | Some x when x.ValueKind = JsonValueKind.Array ->
        x.EnumerateArray() |> Seq.map (fun it -> tryNumber it |> Option.defaultValue nan) |> Seq.toList
    | _ -> []

// Payload-level axis labels take precedence over the generic display-settings
// defaults so that each plot keeps the same meaning as the Python/R renderers
// (e.g. box -> "Columns"/"Values", heatmap -> "Columns"/"Rows", volcano ->
// "Log2 Fold Change"/"-Log10 p-value").
let payloadLabel (el: JsonElement) (name: string) (fallback: string) : string =
    match tryProp el name with
    | Some x when x.ValueKind = JsonValueKind.String ->
        let s = x.GetString()
        if String.IsNullOrEmpty s then fallback else s
    | _ -> fallback

// ---------------------------------------------------------------------------
// Display settings
// ---------------------------------------------------------------------------
type Settings =
    { plotWidth: float
      plotHeight: float
      maxXTicks: int
      maxYTicks: int
      xMaxLabelLength: int
      yMaxLabelLength: int
      autoRotateXLabels: bool
      xTickAngle: float
      yTickAngle: float
      tickFontSize: int
      axisLabelFontSize: int
      pointSize: float
      showGrid: bool
      xAxisLabel: string
      yAxisLabel: string
      plotColors: string list }

let defaultColors = [ "#2563eb"; "#7c3aed"; "#db2777"; "#059669"; "#ea580c"; "#0891b2" ]

let clampN (lo: float) (hi: float) (v: float) = min hi (max lo v)
let clampI (lo: int) (hi: int) (v: int) = min hi (max lo v)

let parseSettings (ds: JsonElement option) : Settings =
    let colors =
        match ds |> Option.bind (fun d -> tryProp d "plotColors") with
        | Some arr when arr.ValueKind = JsonValueKind.Array ->
            arr.EnumerateArray()
            |> Seq.map (fun c -> if c.ValueKind = JsonValueKind.String then c.GetString() else "#2563eb")
            |> Seq.filter (fun s -> not (String.IsNullOrEmpty s))
            |> Seq.toList
        | _ -> []
    let palette = if List.isEmpty colors then defaultColors else colors
    { plotWidth = ds |> Option.map (fun d -> getNumber d "plotWidth" 960.0) |> Option.defaultValue 960.0 |> clampN 640.0 2400.0
      plotHeight = ds |> Option.map (fun d -> getNumber d "plotHeight" 620.0) |> Option.defaultValue 620.0 |> clampN 400.0 1800.0
      maxXTicks = ds |> Option.map (fun d -> getInt d "maxXTicks" 10) |> Option.defaultValue 10 |> clampI 2 30
      maxYTicks = ds |> Option.map (fun d -> getInt d "maxYTicks" 8) |> Option.defaultValue 8 |> clampI 2 20
      xMaxLabelLength = ds |> Option.map (fun d -> getInt d "xMaxLabelLength" 16) |> Option.defaultValue 16 |> clampI 4 60
      yMaxLabelLength = ds |> Option.map (fun d -> getInt d "yMaxLabelLength" 12) |> Option.defaultValue 12 |> clampI 4 40
      autoRotateXLabels = ds |> Option.map (fun d -> getBool d "autoRotateXLabels" true) |> Option.defaultValue true
      xTickAngle = ds |> Option.map (fun d -> getNumber d "xTickAngle" 0.0) |> Option.defaultValue 0.0 |> clampN -90.0 90.0
      yTickAngle = ds |> Option.map (fun d -> getNumber d "yTickAngle" 0.0) |> Option.defaultValue 0.0 |> clampN -90.0 90.0
      tickFontSize = ds |> Option.map (fun d -> getInt d "tickFontSize" 11) |> Option.defaultValue 11 |> clampI 6 24
      axisLabelFontSize = ds |> Option.map (fun d -> getInt d "axisLabelFontSize" 14) |> Option.defaultValue 14 |> clampI 8 32
      pointSize = ds |> Option.map (fun d -> getNumber d "pointSize" 4.0) |> Option.defaultValue 4.0 |> clampN 1.0 16.0
      showGrid = ds |> Option.map (fun d -> getBool d "showGrid" true) |> Option.defaultValue true
      xAxisLabel = ds |> Option.map (fun d -> getStringDef d "xAxisLabel" "X Axis") |> Option.defaultValue "X Axis"
      yAxisLabel = ds |> Option.map (fun d -> getStringDef d "yAxisLabel" "Y Axis") |> Option.defaultValue "Y Axis"
      plotColors = palette }

// ---------------------------------------------------------------------------
// JsonNode helpers for figure assembly
// ---------------------------------------------------------------------------
let jO () = JsonObject()
let jS (s: string) = JsonValue.Create(s)
let jN (v: float) = JsonValue.Create(v)
let jI (v: int) = JsonValue.Create(v)
let jB (v: bool) = JsonValue.Create(v)

let setStr (o: JsonObject) (k: string) (v: string) = o.[k] <- jS v
let setNum (o: JsonObject) (k: string) (v: float) = o.[k] <- jN v
let setBool (o: JsonObject) (k: string) (v: bool) = o.[k] <- jB v
let setInt (o: JsonObject) (k: string) (v: int) = o.[k] <- jI v

let ensureObj (o: JsonObject) (k: string) : JsonObject =
    match o.[k] with
    | :? JsonObject as x -> x
    | _ ->
        let n = jO()
        o.[k] <- n
        n

// Extract the single trace object from a Plotly.NET chart's toJson output.
let traceOf (chart: GenericChart) : JsonObject =
    use doc = JsonDocument.Parse(GenericChart.toJson chart)
    let data = doc.RootElement.GetProperty "data"
    if data.GetArrayLength() > 0 then
        JsonNode.Parse(data.[0].GetRawText()) :?> JsonObject
    else
        jO()

let setTraceText (t: JsonObject) (texts: string list) =
    if not (List.isEmpty texts) then
        let arr = JsonArray()
        texts |> List.iter (fun s -> arr.Add(jS s))
        t.["text"] <- arr
        t.["hovertemplate"] <- jS "%{text}<br>%{x}: %{y}"

// ---------------------------------------------------------------------------
// Layout builder
// ---------------------------------------------------------------------------
let resolveTickAngle (labels: string list) (s: Settings) (plotWidth: float) : float =
    if not s.autoRotateXLabels then s.xTickAngle
    else
        match labels with
        | [] | [ _ ] -> s.xTickAngle
        | _ ->
            let widest =
                labels
                |> List.map (fun l -> (float (String.length l)) * (float s.tickFontSize) * 0.6)
                |> List.max
            let labelHeight = float s.tickFontSize * 1.25
            let spacing = plotWidth / (max 1.0 (float (labels.Length - 1)))
            let available = max 16.0 (spacing - 8.0)
            [ 0.0; 30.0; 45.0; 60.0 ]
            |> List.tryFind (fun angle ->
                let rad = abs angle * Math.PI / 180.0
                let projected = widest * cos rad + labelHeight * sin rad
                projected <= available)
            |> Option.defaultValue 60.0

let baseLayout (title: string) (xLabel: string) (yLabel: string) (xLabels: string list) (s: Settings) (showLegend: bool) : JsonObject =
    let lo = jO()
    let t = jO()
    setStr t "text" title
    let tf = jO()
    setInt tf "size" 16
    setStr tf "color" "#111827"
    t.["font"] <- tf
    lo.["title"] <- t
    setNum lo "width" s.plotWidth
    setNum lo "height" s.plotHeight
    setBool lo "showlegend" showLegend
    let margin = jO()
    setNum margin "l" 64.0
    setNum margin "r" 40.0
    setNum margin "t" 52.0
    setNum margin "b" 60.0
    lo.["margin"] <- margin

    let xa = jO()
    let xt = jO()
    setStr xt "text" xLabel
    let xfont = jO()
    setInt xfont "size" s.axisLabelFontSize
    xt.["font"] <- xfont
    xa.["title"] <- xt
    setBool xa "showgrid" s.showGrid
    setBool xa "automargin" true
    setNum xa "tickangle" (-(resolveTickAngle xLabels s s.plotWidth))
    setInt xa "nticks" (max 2 s.maxXTicks)
    let xtf = jO()
    setInt xtf "size" s.tickFontSize
    xa.["tickfont"] <- xtf
    setBool xa "showticklabels" true
    lo.["xaxis"] <- xa

    let ya = jO()
    let yt = jO()
    setStr yt "text" yLabel
    let yfont = jO()
    setInt yfont "size" s.axisLabelFontSize
    yt.["font"] <- yfont
    ya.["title"] <- yt
    setBool ya "showgrid" s.showGrid
    setBool ya "automargin" true
    setInt ya "nticks" (max 2 s.maxYTicks)
    let ytf = jO()
    setInt ytf "size" s.tickFontSize
    ya.["tickfont"] <- ytf
    lo.["yaxis"] <- ya

    let colorway = JsonArray()
    s.plotColors |> List.iter (fun c -> colorway.Add(jS c))
    lo.["colorway"] <- colorway
    lo

let assemble (traces: JsonObject list) (layout: JsonObject) : string =
    let data = JsonArray()
    traces |> List.iter (fun t -> data.Add(t))
    let fig = jO()
    fig.["data"] <- data
    fig.["layout"] <- layout
    fig.["config"] <- JsonObject()
    fig.ToJsonString()

// ---------------------------------------------------------------------------
// Bar plot
// ---------------------------------------------------------------------------
let renderBar (payload: JsonElement) (settings: Settings) (title: string) : string =
    let categories = getStringArray payload "categories"
    let series =
        match tryProp payload "series" with
        | Some x when x.ValueKind = JsonValueKind.Array ->
            x.EnumerateArray()
            |> Seq.map (fun s -> getStringDef s "name" "Series", getFloatList s "values")
            |> Seq.filter (fun (_, vs) -> List.exists isFin vs)
            |> Seq.toList
        | _ -> []
    if List.isEmpty categories || List.isEmpty series then ""
    else
        let palette = settings.plotColors
        let traces =
            series
            |> List.mapi (fun i (name, values) ->
                let pairs =
                    categories
                    |> List.mapi (fun ci c -> if ci < values.Length then (c, values.[ci]) else (c, nan))
                    |> List.filter (fun (_, v) -> isFin v)
                traceOf (Chart2D.Chart.Column(pairs, Name = name, MarkerColor = Color.fromHex (palette.[i % palette.Length]))))
        let lo = baseLayout title (payloadLabel payload "xAxisLabel" "X Axis") (payloadLabel payload "yAxisLabel" "Y Axis") categories settings (List.length series > 1)
        setStr lo "barmode" "group"
        assemble traces lo

// ---------------------------------------------------------------------------
// Box plot (rendered as a true box-and-whisker; plotly computes the standard
// quartiles/fences/outliers from the raw values like matplotlib/ggplot do).
// ---------------------------------------------------------------------------
let hexToRgba (color: string) (alpha: float) : string =
    let parse (s: string) =
        if s.Length = 7 && s.[0] = '#' then
            let hex s = Convert.ToInt32(s, 16)
            let r = hex s.[1..2]
            let g = hex s.[3..4]
            let b = hex s.[5..6]
            sprintf "rgba(%d, %d, %d, %s)" r g b (alpha.ToString(culture))
        else color
    parse color

let renderBox (payload: JsonElement) (settings: Settings) (title: string) : string =
    let entries =
        match tryProp payload "series" with
        | Some x when x.ValueKind = JsonValueKind.Array ->
            x.EnumerateArray()
            |> Seq.map (fun s -> getStringDef s "name" "Series", getFloatList s "values")
            |> Seq.filter (fun (_, vs) -> List.length vs >= 2)
            |> Seq.truncate 24
            |> Seq.toList
        | _ -> []
    if List.isEmpty entries then ""
    else
        let palette = settings.plotColors
        let traces =
            entries
            |> List.mapi (fun i (name, values) ->
                let vs = values |> List.filter isFin
                let tr = traceOf (Chart2D.Chart.BoxPlot(Y = vs, Name = name, FillColor = Color.fromHex (palette.[i % palette.Length])))
                setStr tr "fillcolor" (hexToRgba (palette.[i % palette.Length]) 0.25)
                let marker = JsonObject()
                let mline = JsonObject()
                setStr mline "color" "#111827"
                marker.["line"] <- mline
                tr.["marker"] <- marker
                tr)
        let lo = baseLayout title "Columns" (payloadLabel payload "yAxisLabel" "Values") (entries |> List.map fst) settings (List.length entries > 1)
        assemble traces lo

// ---------------------------------------------------------------------------
// Scatter plot
// ---------------------------------------------------------------------------
let renderScatter (payload: JsonElement) (settings: Settings) (title: string) : string =
    let series =
        match tryProp payload "series" with
        | Some x when x.ValueKind = JsonValueKind.Array ->
            x.EnumerateArray()
            |> Seq.map (fun s ->
                let name = getStringDef s "name" "Series"
                let xs = getFloatList s "x"
                let ys = getFloatList s "y"
                let labels = getStringArray s "labels"
                name, xs, ys, labels)
            |> Seq.filter (fun (_, xs, ys, _) -> not (List.isEmpty xs) && List.length xs = List.length ys)
            |> Seq.toList
        | _ -> []
    if List.isEmpty series then ""
    else
        let palette = settings.plotColors
        let traces =
            series
            |> List.mapi (fun i (name, xs, ys, labels) ->
                let pairs =
                    xs
                    |> List.mapi (fun j x -> if j < ys.Length then (x, ys.[j]) else (x, nan))
                    |> List.filter (fun (x, y) -> isFin x && isFin y)
                let marker = Marker.init(Size = int (round settings.pointSize), Color = Color.fromHex (palette.[i % palette.Length]))
                let tr = traceOf (Chart2D.Chart.Scatter(pairs, StyleParam.Mode.Markers, Name = name, Marker = marker))
                setTraceText tr (if List.length labels >= List.length xs then labels else [])
                setNum tr "opacity" 0.7
                tr)
        let lo = baseLayout title (payloadLabel payload "xAxisLabel" "X Axis") (payloadLabel payload "yAxisLabel" "Y Axis") [] settings (List.length series > 1)
        setStr lo "hovermode" "closest"
        assemble traces lo

// ---------------------------------------------------------------------------
// Heatmap plot
// ---------------------------------------------------------------------------
let renderHeatmap (payload: JsonElement) (settings: Settings) (title: string) : string =
    let rowLabels = getStringArray payload "row_labels"
    let colLabels = getStringArray payload "col_labels"
    let matrix =
        match tryProp payload "matrix" with
        | Some x when x.ValueKind = JsonValueKind.Array ->
            x.EnumerateArray()
            |> Seq.map (fun row ->
                if row.ValueKind = JsonValueKind.Array then
                    row.EnumerateArray() |> Seq.map (fun c -> tryNumber c |> Option.defaultValue 0.0) |> Seq.toList
                else [])
            |> Seq.toList
        | _ -> []
    if List.isEmpty matrix || List.isEmpty colLabels then ""
    else
        let palette = settings.plotColors
        let tr = traceOf (Chart2D.Chart.Heatmap(matrix, colLabels, rowLabels))
        let pLow = palette |> List.tryItem 0 |> Option.defaultValue "#2563eb"
        let pHigh = palette |> List.tryItem 2 |> Option.defaultValue "#db2777"
        let scale = JsonArray()
        let mkPair (v: float) (c: string) =
            let p = JsonArray()
            p.Add(jN v)
            p.Add(jS c)
            p
        scale.Add(mkPair 0.0 pLow)
        scale.Add(mkPair 0.5 "#f8fafc")
        scale.Add(mkPair 1.0 pHigh)
        tr.["colorscale"] <- scale
        let all = matrix |> List.collect id |> List.filter isFin
        if not (List.isEmpty all) then
            // Symmetric, diverging extent around 0 so the neutral color sits at
            // zero (the correlation midpoint), matching the Python/R renderers.
            let extent = List.map abs all |> List.max |> max 1.0e-9
            setNum tr "zmin" (-extent)
            setNum tr "zmax" extent
            if List.length all <= 144 then
                let textRows = JsonArray()
                matrix
                |> List.iter (fun row ->
                    let cells = JsonArray()
                    row |> List.iter (fun v -> cells.Add(jS (if isFin v then v.ToString("0.00", culture) else "")))
                    textRows.Add(cells))
                tr.["text"] <- textRows
                tr.["texttemplate"] <- jS "%{text}"
                let tfont = jO()
                setInt tfont "size" 10
                setStr tfont "color" "#111827"
                tr.["textfont"] <- tfont
        let lo = baseLayout title "Columns" (payloadLabel payload "yAxisLabel" "Rows") colLabels settings false
        let ya = ensureObj lo "yaxis"
        setStr ya "autorange" "reversed"
        assemble [ tr ] lo

// ---------------------------------------------------------------------------
// Volcano plot
// ---------------------------------------------------------------------------
let renderVolcano (payload: JsonElement) (settings: Settings) (title: string) : string =
    let xs = getFloatList payload "x"
    let ys = getFloatList payload "y"
    if List.isEmpty xs || List.isEmpty ys then ""
    else
        let labels = getStringArray payload "labels"
        let xThreshold = getNumber payload "xThreshold" 1.0
        let yThresholdRaw = getNumber payload "yThreshold" nan
        let yTransform = getStringDef payload "yTransform" ""
        // When a -log10 Y transform is requested but no threshold is supplied,
        // default to the conventional p-value cutoff of 0.05 (as Python does).
        let yThreshold =
            if not (isFin yThresholdRaw) && yTransform = "negative-log10" then 0.05
            else yThresholdRaw
        let yValues =
            if yTransform = "negative-log10" then
                ys |> List.map (fun v -> -Math.Log10 (max v 1.0e-300))
            else ys
        let thresholdY = if yTransform = "negative-log10" && isFin yThreshold then -Math.Log10 yThreshold else yThreshold

        let legendLabels =
            match tryProp payload "legendLabels" with
            | Some o ->
                getStringDef o "notSignificant" "Not significant",
                getStringDef o "positive" "Above + threshold",
                getStringDef o "negative" "Below - threshold"
            | None ->
                "Not significant", "Above + threshold", "Below - threshold"
        let notSigLabel, posLabel, negLabel = legendLabels

        let palette = settings.plotColors
        let notSigColor = palette.[min 4 (palette.Length - 1)]
        let posColor = palette.[min 2 (palette.Length - 1)]
        let negColor = palette.[min 0 (palette.Length - 1)]

        let classify (x: float) (y: float) =
            let isXSignificant = isFin xThreshold && abs x > xThreshold
            let isYSignificant = (not (isFin thresholdY)) || y > thresholdY
            if isXSignificant && isYSignificant then (if x >= 0.0 then 1 else 2) else 0

        let groups = Array.init 3 (fun _ -> ResizeArray<string * float * float>())
        xs
        |> List.iteri (fun i x ->
            let y = if i < yValues.Length then yValues.[i] else nan
            if isFin x && isFin y then
                let label = if i < labels.Length then labels.[i] else sprintf "row_%d" (i + 1)
                groups.[classify x y].Add(label, x, y))

        let buildTrace (name: string) (color: string) (points: (string * float * float) seq) =
            if Seq.isEmpty points then None
            else
                let pairs = points |> Seq.map (fun (_, x, y) -> (x, y)) |> Seq.toList
                let texts = points |> Seq.map (fun (l, _, _) -> l) |> Seq.toList
                let marker = Marker.init(Size = int (round settings.pointSize), Color = Color.fromHex color)
                let tr = traceOf (Chart2D.Chart.Scatter(pairs, StyleParam.Mode.Markers, Name = name, Marker = marker))
                setTraceText tr texts
                setNum tr "opacity" 0.7
                Some tr

        let traces =
            [ buildTrace notSigLabel notSigColor groups.[0]
              buildTrace posLabel posColor groups.[1]
              buildTrace negLabel negColor groups.[2] ]
            |> List.choose id

        let lo = baseLayout title (payloadLabel payload "xAxisLabel" "X Axis") (payloadLabel payload "yAxisLabel" "Y Axis") [] settings true
        setStr lo "hovermode" "closest"

        let yMin = if List.isEmpty yValues then 0.0 else List.min yValues
        let yMax = if List.isEmpty yValues then 1.0 else List.max yValues
        let shapes = JsonArray()
        if isFin xThreshold then
            [ -xThreshold; xThreshold ]
            |> List.iter (fun tx ->
                let sh = jO()
                setStr sh "type" "line"
                setNum sh "x0" tx
                setNum sh "x1" tx
                setNum sh "y0" yMin
                setNum sh "y1" yMax
                let line = jO()
                setStr line "color" "#111827"
                setStr line "dash" "dash"
                setNum line "width" 1.0
                sh.["line"] <- line
                shapes.Add(sh))
        if isFin thresholdY then
            let sh = jO()
            setStr sh "type" "line"
            let xMin = if List.isEmpty xs then 0.0 else List.min xs
            let xMax = if List.isEmpty xs then 1.0 else List.max xs
            setNum sh "x0" xMin
            setNum sh "x1" xMax
            setNum sh "y0" thresholdY
            setNum sh "y1" thresholdY
            let line = jO()
            setStr line "color" "#111827"
            setStr line "dash" "dash"
            setNum line "width" 1.0
            sh.["line"] <- line
            shapes.Add(sh)
        if shapes.Count > 0 then lo.["shapes"] <- shapes

        assemble traces lo

// ---------------------------------------------------------------------------
// PCA plot (projection computed with FSharp.Stats)
// ---------------------------------------------------------------------------
let renderPca (payload: JsonElement) (settings: Settings) (title: string) : string =
    let labels = getStringArray payload "labels"
    let groups = getStringArray payload "groups"
    let rows =
        match tryProp payload "data" with
        | Some x when x.ValueKind = JsonValueKind.Array ->
            x.EnumerateArray()
            |> Seq.map (fun row ->
                if row.ValueKind = JsonValueKind.Array then
                    row.EnumerateArray() |> Seq.map (fun c -> tryNumber c |> Option.defaultValue nan) |> Seq.toList
                else [])
            |> Seq.toList
        | _ -> []
    let clean = rows |> List.filter (fun r -> List.length r >= 2 && List.forall isFin r)
    if List.length clean < 2 then ""
    else
        let matrix = Matrix.ofJaggedSeq (clean |> List.map (fun r -> r :> seq<float>))
        let pca = FSharp.Stats.ML.Unsupervised.PCA.compute (FSharp.Stats.ML.Unsupervised.PCA.center matrix)
        let n = matrix.NumRows
        let pc1 i = pca.PrincipalComponents.[i, 0]
        let pc2 i = pca.PrincipalComponents.[i, 1]

        let hasGroups = List.length groups >= List.length clean
        let groupOf (i: int) = if hasGroups then groups.[i] else "PCA"

        let traces =
            let palette = settings.plotColors
            clean
            |> List.mapi (fun i r -> i, pc1 i, pc2 i)
            |> List.groupBy (fun (i, _, _) -> groupOf i)
            |> List.mapi (fun gi (gname, pts) ->
                let pairs = pts |> List.map (fun (_, x, y) -> (x, y))
                let texts = pts |> List.map (fun (i, _, _) -> if i < labels.Length then labels.[i] else sprintf "point_%d" (i + 1))
                let marker = Marker.init(Size = int (round settings.pointSize), Color = Color.fromHex (palette.[gi % palette.Length]))
                let tr = traceOf (Chart2D.Chart.Scatter(pairs, StyleParam.Mode.Markers, Name = gname, Marker = marker))
                setTraceText tr texts
                setNum tr "opacity" 0.7
                tr)

        let lo = baseLayout title "PC1" "PC2" [] settings hasGroups
        setStr lo "hovermode" "closest"
        let varExplained =
            try
                [ 0; 1 ] |> List.map (fun c -> pca.VarExplainedByComponentIndividual.[c] * 100.0)
            with _ -> [ 0.0; 0.0 ]
        let xa = ensureObj lo "xaxis"
        let xt = ensureObj xa "title"
        setStr xt "text" (if varExplained.Length > 0 then sprintf "PC1 (%0.1f%%)" varExplained.[0] else "PC1")
        let ya = ensureObj lo "yaxis"
        let yt = ensureObj ya "title"
        setStr yt "text" (if varExplained.Length > 1 then sprintf "PC2 (%0.1f%%)" varExplained.[1] else "PC2")
        assemble traces lo

// ---------------------------------------------------------------------------
// Shared renderer and persistent worker entry point
// ---------------------------------------------------------------------------
let renderRoot (root: JsonElement) : string =
    let plotType = getStringDef root "plotType" "bar"
    let payload = match tryProp root "payload" with Some x -> x | None -> root
    let title = getStringDef payload "title" (plotType + " Plot")
    let settings = tryProp payload "displaySettings" |> parseSettings

    let json =
        match plotType with
        | "bar" -> renderBar payload settings title
        | "box" -> renderBox payload settings title
        | "scatter" -> renderScatter payload settings title
        | "pca" -> renderPca payload settings title
        | "heatmap" -> renderHeatmap payload settings title
        | "volcano" -> renderVolcano payload settings title
        | _ -> renderBar payload settings title

    if String.IsNullOrEmpty json then
        invalidOp (sprintf "Unable to render plot type: %s" plotType)
    json

let renderText (text: string) : string =
    use doc = JsonDocument.Parse text
    renderRoot doc.RootElement

let emitWorkerMessage (message: JsonObject) =
    Console.Out.WriteLine(message.ToJsonString())
    Console.Out.Flush()

let runWorker () : int =
    let ready = jO()
    setStr ready "type" "ready"
    emitWorkerMessage ready

    let mutable line = Console.In.ReadLine()
    while not (isNull line) do
        if not (String.IsNullOrWhiteSpace line) then
            try
                use requestDoc = JsonDocument.Parse line
                let request = requestDoc.RootElement
                let requestId =
                    match tryProp request "id" with
                    | Some id when id.ValueKind = JsonValueKind.Number -> id.GetInt32()
                    | _ -> invalidArg "id" "Worker request must contain a numeric id"
                // The request itself is the normal plot document plus its
                // transport id. Rendering it directly keeps worker and
                // one-shot payload contracts identical.
                let result = renderRoot request
                let response = jO()
                setInt response "id" requestId
                setBool response "ok" true
                setStr response "result" result
                emitWorkerMessage response
            with
            | ex ->
                let response = jO()
                try
                    use failedDoc = JsonDocument.Parse line
                    match tryProp failedDoc.RootElement "id" with
                    | Some id when id.ValueKind = JsonValueKind.Number ->
                        setInt response "id" (id.GetInt32())
                    | _ -> setInt response "id" -1
                with
                | _ -> setInt response "id" -1
                setBool response "ok" false
                setStr response "error" (sprintf "%s: %s" (ex.GetType().Name) ex.Message)
                emitWorkerMessage response
        line <- Console.In.ReadLine()
    0

[<EntryPoint>]
let main argv =
    Console.OutputEncoding <- Encoding.UTF8
    try
        if argv.Length > 0 && argv.[0] = "--worker" then
            runWorker()
        elif argv.Length < 1 then
            eprintfn "No payload file provided"
            1
        else
            printfn "%s" (File.ReadAllText argv.[0] |> renderText)
            0
    with
    | ex ->
        eprintfn "F# renderer error: %s" ex.Message
        1
