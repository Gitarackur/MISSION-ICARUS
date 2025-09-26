import * as d3 from "d3";


export function wrapText<D>(
  text: d3.Selection<SVGTextElement, D, SVGGElement, unknown>,
  width: number
): void {
  text.each(function () {
    const textEl = d3.select<SVGTextElement, D>(this);
    const words: string[] = textEl.text().split(/\s+/).reverse();
    let word: string | undefined;
    let line: string[] = [];
    let lineNumber = 0;
    const lineHeight = 1.2;
    const y = textEl.attr("y") ?? "0";
    const dy = parseFloat(textEl.attr("dy") ?? "0");

    let tspan = textEl
      .text(null)
      .append("tspan")
      .attr("x", 0)
      .attr("y", y)
      .attr("dy", `${dy}em`);

    while ((word = words.pop())) {
      line.push(word);
      tspan.text(line.join(" "));

      if (tspan.node()!.getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = textEl
          .append("tspan")
          .attr("x", 0)
          .attr("y", y)
          .attr("dy", `${++lineNumber * lineHeight + dy}em`)
          .text(word);
      }
    }
  });
}
