import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { buildActivityTree } from "@/app-layer/algorithms/tree";
import { ActivityTreeNodeForD3 } from "@/domain/tree/tree.types";
import {
  activityTreeStyle,
  buttonStyle,
} from "./variants/activity.style.variant";
import { DisplayedActivityTree } from "./types/activity-node.types";
import { IcarusVisualization } from "@/domain/workflow/main.types";
import { useThemeMode } from "@/ui/theme/use-theme-mode";
import {
  formatAxisLabel,
  getVisualizationLabel,
  getVisualizationMatrixId,
  sortVisualizationsByCreatedAt,
} from "@/domain/visualization/utils/main";
import { Minus, Plus, RefreshCcw } from "lucide-react";
import { wrapText } from "./utils/main";
import {
  getActivityMatrixId,
  getActivityTreeSelection,
} from "./utils/navigation";

const getRendererLabel = (renderer?: IcarusVisualization["renderer"]) => {
  if (renderer === "recharts") {
    return "native";
  }

  return renderer ?? "saved";
};

const ActivityTree2 = ({
  sessionData,
  activeMatrixId,
  onClickOfInputButton,
  onClickOfOutputButton,
  onClickOfVisualizationButton,
  onDeleteMatrix,
  onDeleteActivity,
  onDeleteVisualization,
}: DisplayedActivityTree) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState(0.8);
  const [isPanning, setIsPanning] = useState(false);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();
  const handlersRef = useRef({
    onClickOfInputButton,
    onClickOfOutputButton,
    onClickOfVisualizationButton,
    onDeleteMatrix,
    onDeleteActivity,
    onDeleteVisualization,
  });
  handlersRef.current = {
    onClickOfInputButton,
    onClickOfOutputButton,
    onClickOfVisualizationButton,
    onDeleteMatrix,
    onDeleteActivity,
    onDeleteVisualization,
  };
  const { resolvedMode } = useThemeMode();
  const isDarkMode = resolvedMode === "dark";
  const palette = useMemo(
    () =>
      isDarkMode
        ? {
            link: "#374151",
            text: "#e5e7eb",
            mutedText: "#9ca3af",
            nodeStroke: "#374151",
            nodeFill: {
              0: "#172554",
              1: "#052e1b",
              2: "#451a03",
              default: "#111827",
            },
            visualizationFill: "#2e1065",
            visualizationStroke: "#6d28d9",
            visualizationText: "#ddd6fe",
            inputFill: "#172554",
            inputStroke: "#1d4ed8",
            inputText: "#bfdbfe",
            outputFill: "#052e1b",
            outputStroke: "#15803d",
            outputText: "#bbf7d0",
            dangerFill: "#450a0a",
            dangerStroke: "#991b1b",
            dangerText: "#fecaca",
          }
        : {
            link: "#d1d5db",
            text: "#374151",
            mutedText: "#6b7280",
            nodeStroke: "#d1d5db",
            nodeFill: {
              0: "#eff6ff",
              1: "#ecfdf5",
              2: "#fffbeb",
              default: "#f9fafb",
            },
            visualizationFill: "#f5f3ff",
            visualizationStroke: "#c4b5fd",
            visualizationText: "#6d28d9",
            inputFill: "#dbeafe",
            inputStroke: "#93c5fd",
            inputText: "#1d4ed8",
            outputFill: "#dcfce7",
            outputStroke: "#86efac",
            outputText: "#15803d",
            dangerFill: "#fef2f2",
            dangerStroke: "#fca5a5",
            dangerText: "#b91c1c",
          },
    [isDarkMode]
  );

  // Extract the styles
  const {
    base,
    header,
    zoomInfo,
    controlsContainer,
    contentArea,
    svg,
    tooltip,
  } = activityTreeStyle();

  useEffect(() => {
    if (!sessionData.activities?.length) return;

    const activities = sessionData.activities;
    const visualizationsByActivity = sortVisualizationsByCreatedAt(
      sessionData.visualizations ?? []
    ).reduce<Map<string, IcarusVisualization[]>>((acc, visualization) => {
      if (!visualization.createdByActivityId) return acc;

      const current = acc.get(visualization.createdByActivityId) ?? [];
      current.push(visualization);
      acc.set(visualization.createdByActivityId, current);
      return acc;
    }, new Map());
    const roots = buildActivityTree(activities);
    const activateNode = (node: ActivityTreeNodeForD3) => {
      const selection = getActivityTreeSelection(
        node.activity,
        visualizationsByActivity.get(node.activity.id) ?? []
      );
      if (!selection) return;

      if (selection.kind === "visualization") {
        handlersRef.current.onClickOfVisualizationButton?.(
          selection.visualizationId,
          selection.sourceMatrixId
        );
        return;
      }

      handlersRef.current.onClickOfOutputButton?.(selection.matrixId);
    };

    const hierarchyRoots = roots.map((r) =>
      d3.hierarchy<ActivityTreeNodeForD3>(r, (d) => d.children)
    );

    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    svg.attr("width", containerWidth).attr("height", containerHeight);

    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        setZoomLevel(event.transform.k);
        g.attr("transform", event.transform.toString());
      })
      .on("start", () => setIsPanning(true))
      .on("end", () => setIsPanning(false));

    zoomBehaviorRef.current = zoom;

    svg.call(zoom);

    const nodeWidth = 180;
    const nodeHeight = 150;
    const siblingSeparation = 40;
    const generationSeparation = 120;

    const treeLayout = d3
      .tree<ActivityTreeNodeForD3>()
      .nodeSize([
        nodeWidth + siblingSeparation,
        nodeHeight + generationSeparation,
      ]);

    let xOffset = 0;
    const treeWidths: number[] = [];

    hierarchyRoots.forEach((root) => {
      const tree = treeLayout(root);
      const descendants = tree.descendants();
      if (descendants.length === 0) return;

      const xExtent = d3.extent(descendants, (d) => d.x) as [number, number];
      const width = xExtent[1] - xExtent[0] + nodeWidth;
      treeWidths.push(width);
    });

    const totalWidth = treeWidths.reduce((sum, width) => sum + width + 100, 0);

    if (totalWidth > containerWidth) {
      svg.attr("width", totalWidth);
    }

    hierarchyRoots.forEach((root, i) => {
      const tree = treeLayout(root);
      const descendants = tree.descendants();
      if (descendants.length === 0) return;

      const xExtent = d3.extent(descendants, (d) => d.x) as [number, number];
      const treeWidth = xExtent[1] - xExtent[0] + nodeWidth;

      const treeXOffset = xOffset + (treeWidths[i] - treeWidth) / 2;

      // Links
      const links = tree.links();
      const linkGenerator = d3
        .linkVertical<
          d3.HierarchyPointLink<ActivityTreeNodeForD3>,
          d3.HierarchyPointNode<ActivityTreeNodeForD3>
        >()
        .x((d) => d.x + treeXOffset)
        .y((d) => d.y + 50);

      g.selectAll<SVGPathElement, d3.HierarchyPointLink<ActivityTreeNodeForD3>>(
        `.link-${i}`
      )
        .data(links)
        .join("path")
        .attr("class", `link-${i}`)
        .attr("fill", "none")
        .attr("stroke", palette.link)
        .attr("stroke-width", 1.5)
        .attr(
          "d",
          (d: d3.HierarchyPointLink<ActivityTreeNodeForD3>) => linkGenerator(d)!
        );

      // Nodes
      const nodes = g
        .selectAll<SVGGElement, d3.HierarchyPointNode<ActivityTreeNodeForD3>>(
          `.node-${i}`
        )
        .data(tree.descendants())
        .join("g")
        .attr("class", `node-${i}`)
        .attr("role", "button")
        .attr("tabindex", 0)
        .attr("aria-label", (d) => `Open activity ${d.data.activity.name}`)
        .style("cursor", "pointer")
        .attr(
          "transform",
          (d) => `translate(${d.x + treeXOffset},${d.y + 50})`
        )
        .on("click", (event: MouseEvent, d) => {
          event.stopPropagation();
          activateNode(d.data);
        })
        .on("keydown", (event: KeyboardEvent, d) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          event.stopPropagation();
          activateNode(d.data);
        });

      // Node background
      nodes
        .append("rect")
        .attr("x", -nodeWidth / 2)
        .attr("y", -nodeHeight / 2)
        .attr("width", nodeWidth)
        .attr("height", nodeHeight)
        .attr("rx", 8)
        .attr("ry", 8)
        .attr("fill", (d) => {
          switch (d.data.depth) {
            case 0:
              return palette.nodeFill[0];
            case 1:
              return palette.nodeFill[1];
            case 2:
              return palette.nodeFill[2];
            default:
              return palette.nodeFill.default;
          }
        })
        .attr("stroke", (d) => {
          if (getActivityMatrixId(d.data.activity) === activeMatrixId) {
            return "red";
          }
          return palette.nodeStroke;
        })
        .attr("stroke-width", 1.5);

      // Activity name
      nodes
        .append("text")
        .attr("dy", "-1.8em")
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "600")
        .attr("fill", palette.text)
        .text((d) => d.data.activity.name)
        .call(wrapText, 80);

      if (handlersRef.current.onDeleteActivity) {
        const activityDeleteButton = nodes
          .append("g")
          .attr("transform", `translate(${nodeWidth / 2 - 26}, ${-nodeHeight / 2 + 10})`)
          .attr("role", "button")
          .attr("tabindex", 0)
          .attr("aria-label", (d) => `Delete activity ${d.data.activity.name}`)
          .style("cursor", "pointer")
          .on("click", (event: MouseEvent, d) => {
            event.stopPropagation();
            handlersRef.current.onDeleteActivity?.(d.data.activity.id);
          })
          .on("keydown", (event: KeyboardEvent, d) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            event.stopPropagation();
            handlersRef.current.onDeleteActivity?.(d.data.activity.id);
          });

        activityDeleteButton
          .append("rect")
          .attr("width", 18)
          .attr("height", 18)
          .attr("rx", 4)
          .attr("fill", palette.dangerFill)
          .attr("stroke", palette.dangerStroke);

        activityDeleteButton
          .append("text")
          .attr("x", 9)
          .attr("y", 13)
          .attr("font-size", "14px")
          .attr("text-anchor", "middle")
          .attr("fill", palette.dangerText)
          .text("×");
      }

      nodes.each(function (d) {
        const activityVisualizations =
          visualizationsByActivity.get(d.data.activity.id) ?? [];

        if (
          !activityVisualizations.length ||
          !handlersRef.current.onClickOfVisualizationButton
        ) {
          return;
        }

        const plotGroup = d3
          .select(this)
          .append("g")
          .attr("transform", `translate(${-nodeWidth / 2 + 12}, 10)`);

        activityVisualizations.slice(0, 4).forEach((visualization, index) => {
          const sourceMatrixId =
            getVisualizationMatrixId(visualization) ??
            d.data.activity.outputMatrixReference ??
            d.data.activity.inputMatrixReferences;
          const visualizationLabel =
            visualization.visualizationType ??
            getVisualizationLabel(visualization, index);
          const label = `${visualizationLabel} · ${getRendererLabel(
            visualization.renderer
          )}`;
          const button = plotGroup
            .append("g")
            .attr(
              "transform",
              `translate(${(index % 2) * 80}, ${Math.floor(index / 2) * 20})`
            )
            .style("cursor", "pointer")
            .on("click", (event: MouseEvent) => {
              event.stopPropagation();
              handlersRef.current.onClickOfVisualizationButton?.(
                visualization.id,
                sourceMatrixId ?? undefined
              );
            });

          button
            .append("rect")
            .attr("width", 74)
            .attr("height", 18)
            .attr("rx", 4)
            .attr("fill", palette.visualizationFill)
            .attr("stroke", palette.visualizationStroke);

          button
            .append("text")
            .attr("x", handlersRef.current.onDeleteVisualization ? 30 : 37)
            .attr("y", 12)
            .attr("font-size", "9px")
            .attr("text-anchor", "middle")
            .attr("fill", palette.visualizationText)
            .text(formatAxisLabel(label, 11));

          if (handlersRef.current.onDeleteVisualization) {
            const deleteButton = button
              .append("g")
              .attr("transform", "translate(57, 0)")
              .attr("role", "button")
              .attr("tabindex", 0)
              .attr("aria-label", `Delete visualization ${visualizationLabel}`)
              .on("click", (event: MouseEvent) => {
                event.stopPropagation();
                handlersRef.current.onDeleteVisualization?.(visualization.id);
              })
              .on("keydown", (event: KeyboardEvent) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                event.stopPropagation();
                handlersRef.current.onDeleteVisualization?.(visualization.id);
              });

            deleteButton
              .append("rect")
              .attr("width", 17)
              .attr("height", 18)
              .attr("rx", 4)
              .attr("fill", palette.dangerFill);
            deleteButton
              .append("text")
              .attr("x", 8.5)
              .attr("y", 13)
              .attr("font-size", "13px")
              .attr("text-anchor", "middle")
              .attr("fill", palette.dangerText)
              .text("×");
          }
        });

        if (activityVisualizations.length > 4) {
          plotGroup
            .append("text")
            .attr("x", 166)
            .attr("y", 32)
            .attr("font-size", "10px")
            .attr("fill", palette.mutedText)
            .text(`+${activityVisualizations.length - 4}`);
        }
      });

      // Count tspans (number of wrapped lines)
      // const lineCount = activityNameText.selectAll("tspan").size();

      // Activity ID
      // nodes
      //   .append("text")
      //   .attr("dy", "-0.8em")
      //   .attr("dy", `${-1.8 + lineCount * 0.4 + 1}em`)
      //   .attr("text-anchor", "middle")
      //   .attr("font-size", "10px")
      //   .attr("fill", "#6b7280")
      //   .text((d) => `ID: ${d.data.activity.id.slice(-8)}`);

      // Button container
      const buttonGroup = nodes
        .append("g")
        .attr("transform", `translate(0, ${nodeHeight / 2 - 30})`);

      // Input button
      const inputButton = buttonGroup
        .filter((d) => Boolean(d.data.activity.inputMatrixReferences))
        .append("g")
        // .attr("transform", "translate(-45, 0)")
        .attr("transform", "translate(-81, -3)")
        .style("cursor", "pointer")
        .on("click", (event: MouseEvent, d) => {
          event.stopPropagation();
          d.data.activity.inputMatrixReferences &&
            handlersRef.current.onClickOfInputButton?.(
              d.data.activity.inputMatrixReferences
            );
        });

      inputButton
        .append("rect")
        .attr("width", 77)
        .attr("height", 24)
        .attr("rx", 4)
        .attr("fill", palette.inputFill)
        .attr("stroke", palette.inputStroke);

      inputButton
        .append("text")
        .attr("x", handlersRef.current.onDeleteMatrix ? 32 : 40)
        .attr("y", 14)
        .attr("font-size", "10px")
        .attr("text-anchor", "middle")
        .attr("fill", palette.inputText)
        .text("⬇ Input");

      if (handlersRef.current.onDeleteMatrix) {
        const inputDeleteButton = inputButton
          .filter((d) => Boolean(d.data.activity.inputMatrixReferences))
          .append("g")
          .attr("transform", "translate(59, 3)")
          .attr("role", "button")
          .attr("tabindex", 0)
          .attr(
            "aria-label",
            (d) => `Delete input matrix ${d.data.activity.inputMatrixReferences}`
          )
          .on("click", (event: MouseEvent, d) => {
            event.stopPropagation();
            if (d.data.activity.inputMatrixReferences) {
              handlersRef.current.onDeleteMatrix?.(
                d.data.activity.inputMatrixReferences
              );
            }
          })
          .on("keydown", (event: KeyboardEvent, d) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            event.stopPropagation();
            if (d.data.activity.inputMatrixReferences) {
              handlersRef.current.onDeleteMatrix?.(
                d.data.activity.inputMatrixReferences
              );
            }
          });

        inputDeleteButton
          .append("rect")
          .attr("width", 15)
          .attr("height", 18)
          .attr("rx", 3)
          .attr("fill", palette.dangerFill);
        inputDeleteButton
          .append("text")
          .attr("x", 7.5)
          .attr("y", 13)
          .attr("font-size", "12px")
          .attr("text-anchor", "middle")
          .attr("fill", palette.dangerText)
          .text("×");
      }

      // Output button
      const outputButton = buttonGroup
        .filter((d) => Boolean(d.data.activity.outputMatrixReference))
        .append("g")
        // .attr("transform", "translate(45, 0)")
        .attr("transform", "translate(5, -3)")
        .style("cursor", "pointer")
        .on("click", (event: MouseEvent, d) => {
          event.stopPropagation();
          d.data.activity.outputMatrixReference &&
            handlersRef.current.onClickOfOutputButton?.(
              d.data.activity.outputMatrixReference
            );
        });

      outputButton
        .append("rect")
        .attr("width", 75)
        .attr("height", 24)
        .attr("rx", 4)
        .attr("fill", palette.outputFill)
        .attr("stroke", palette.outputStroke);

      outputButton
        .append("text")
        .attr("x", handlersRef.current.onDeleteMatrix ? 32 : 40)
        .attr("y", 14)
        .attr("font-size", "10px")
        .attr("text-anchor", "middle")
        .attr("fill", palette.outputText)
        .text("⬆ Output");

      if (handlersRef.current.onDeleteMatrix) {
        const outputDeleteButton = outputButton
          .filter((d) => Boolean(d.data.activity.outputMatrixReference))
          .append("g")
          .attr("transform", "translate(57, 3)")
          .attr("role", "button")
          .attr("tabindex", 0)
          .attr(
            "aria-label",
            (d) => `Delete output matrix ${d.data.activity.outputMatrixReference}`
          )
          .on("click", (event: MouseEvent, d) => {
            event.stopPropagation();
            if (d.data.activity.outputMatrixReference) {
              handlersRef.current.onDeleteMatrix?.(
                d.data.activity.outputMatrixReference
              );
            }
          })
          .on("keydown", (event: KeyboardEvent, d) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            event.stopPropagation();
            if (d.data.activity.outputMatrixReference) {
              handlersRef.current.onDeleteMatrix?.(
                d.data.activity.outputMatrixReference
              );
            }
          });

        outputDeleteButton
          .append("rect")
          .attr("width", 15)
          .attr("height", 18)
          .attr("rx", 3)
          .attr("fill", palette.dangerFill);
        outputDeleteButton
          .append("text")
          .attr("x", 7.5)
          .attr("y", 13)
          .attr("font-size", "12px")
          .attr("text-anchor", "middle")
          .attr("fill", palette.dangerText)
          .text("×");
      }

      // Update xOffset for next tree
      xOffset += treeWidths[i] + 100;
    });

    // Replace the initial zoom section with this improved version:
    // Set initial zoom to fit the entire tree
    const gNode = g.node() as SVGGElement;
    if (gNode) {
      // Get the bounding box of the entire group (all trees)
      const gBBox = gNode.getBBox();

      // Calculate the scale to fit the entire tree
      const scale =
        Math.min(
          containerWidth / (gBBox.width + 100),
          containerHeight / (gBBox.height + 100)
        ) * 0.9; // Add some padding

      // Calculate translation to center the tree
      const translateX =
        (containerWidth - gBBox.width * scale) / 2 - gBBox.x * scale;
      const translateY =
        (containerHeight - gBBox.height * scale) / 2 - gBBox.y * scale;

      // Apply the initial transform
      svg.call(
        zoom.transform,
        d3.zoomIdentity.translate(translateX, translateY).scale(scale)
      );
    }
  }, [
    sessionData,
    palette,
    activeMatrixId,
  ]);

  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      const svg = d3.select(svgRef.current);
      const currentTransform = d3.zoomTransform(svg.node() as SVGSVGElement);
      const newScale = Math.min(currentTransform.k * 1.2, 3);

      svg.call(
        zoomBehaviorRef.current.transform,
        d3.zoomIdentity
          .translate(currentTransform.x, currentTransform.y)
          .scale(newScale)
      );
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      const svg = d3.select(svgRef.current);
      const currentTransform = d3.zoomTransform(svg.node() as SVGSVGElement);
      const newScale = Math.max(currentTransform.k / 1.2, 0.2);

      svg.call(
        zoomBehaviorRef.current.transform,
        d3.zoomIdentity
          .translate(currentTransform.x, currentTransform.y)
          .scale(newScale)
      );
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && containerRef.current && zoomBehaviorRef.current) {
      const svg = d3.select(svgRef.current);
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      const g = svg.select("g");
      const allNodes = g.selectAll<SVGGElement, unknown>("[class^='node-']");

      if (allNodes.size() > 0) {
        const node = allNodes.node() as SVGGElement;
        const bbox = node.getBBox();

        const scale = 1
          // Math.min(
          //   containerWidth / (bbox.width + 100),
          //   containerHeight / (bbox.height + 100)
          // ) * 0.9;

        const translateX =
          (containerWidth - bbox.width * scale) / 2 - bbox.x * scale;
        const translateY =
          (containerHeight - bbox.height * scale) / 2 - bbox.y * scale;

        svg.call(
          zoomBehaviorRef.current.transform,
          d3.zoomIdentity.translate(translateX, translateY).scale(scale)
        );
      }
    }
  };

  return (
    <div className={base()}>
      <div className={header()}>
        <div className={controlsContainer()}>
          <span className={zoomInfo()}>
            Zoom: {Math.round(zoomLevel * 100)}%
          </span>
          <div className="w-3"></div>
          <button
            onClick={handleZoomOut}
            className={buttonStyle({ intent: "ghost" })}
          >
            <Minus size={14} />
          </button>

          <button
            onClick={handleZoomIn}
            className={buttonStyle({ intent: "ghost" })}
          >
            <Plus size={14} />
          </button>
          <button
            onClick={handleResetZoom}
            className={buttonStyle({ intent: "control" })}
          >
            <RefreshCcw size={14} />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={contentArea()}
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
      >
        <svg ref={svgRef} className={svg()} />

        <div className={tooltip()}>
          <div>💡 Use mouse wheel to zoom, drag to pan</div>
          <div>Click on ⬇ Input or ⬆ Output buttons to view matrices</div>
          <div>
            <span className=" text-red-600">Red border&nbsp;</span>
            indicates the currently selected matrix in the main view
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityTree2;
