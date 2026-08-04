import type {
  IcarusActivityRecord,
  IcarusSessionRecord,
  IcarusSessionWithWorkflowRecord,
  IcarusVisualizationRecord,
} from "./database.types";

export type DeletionTargetType = "matrix" | "activity" | "visualization";

export interface DeletionPlan {
  targetId: string;
  targetType: DeletionTargetType;
  matrixIds: string[];
  activityIds: string[];
  visualizationIds: string[];
  dependentMatrixIds: string[];
  directDependentActivityIds: string[];
  directDependentVisualizationIds: string[];
  isSourceMatrix: boolean;
}

export interface SessionDeletionResult {
  plan: DeletionPlan;
  session: IcarusSessionWithWorkflowRecord;
}

export interface PhysicalDeletionScope {
  matrixIds: string[];
  activityIds: string[];
  visualizationIds: string[];
}

const getActivityMatrixInputs = (activity: IcarusActivityRecord) => {
  const references = new Set<string>();

  if (activity.sourceMatrixId) {
    references.add(activity.sourceMatrixId);
  }

  // Older data can contain an array even though current records use one ID.
  const inputReferences = activity.inputMatrixReferences as unknown;
  if (Array.isArray(inputReferences)) {
    inputReferences.forEach((reference) => {
      if (typeof reference === "string" && reference) references.add(reference);
    });
  } else if (typeof inputReferences === "string" && inputReferences) {
    references.add(inputReferences);
  }

  return references;
};

export const getActivityReferencedMatrixIds = (
  activity: IcarusActivityRecord
) => {
  const references = getActivityMatrixInputs(activity);
  if (activity.outputMatrixReference) {
    references.add(activity.outputMatrixReference);
  }
  return references;
};

export const getVisualizationReferencedMatrixIds = (
  visualization: IcarusVisualizationRecord
) => {
  const references = new Set<string>();
  if (visualization.sourceMatrixId) {
    references.add(visualization.sourceMatrixId);
  }

  // Some early visualization records only persisted the matrix in their payload.
  const data = visualization.data;
  if (data && typeof data === "object" && "matrixId" in data) {
    const matrixId = (data as { matrixId?: unknown }).matrixId;
    if (typeof matrixId === "string" && matrixId) references.add(matrixId);
  }

  return references;
};

const orderedIds = (ids: string[], selected: Set<string>) =>
  ids.filter((id) => selected.has(id));

const requireSessionRecord = (
  session: IcarusSessionWithWorkflowRecord,
  type: DeletionTargetType,
  id: string
) => {
  const exists =
    type === "matrix"
      ? session.matrixIds.includes(id) &&
        session.matrices.some((matrix) => matrix.id === id)
      : type === "activity"
        ? session.activityIds.includes(id) &&
          session.activities.some((activity) => activity.id === id)
        : session.visualizationIds.includes(id) &&
          session.visualizations.some(
            (visualization) => visualization.id === id
          );

  if (!exists) {
    throw new Error(
      `${type[0].toUpperCase()}${type.slice(1)} ${id} is not part of session ${session.id}`
    );
  }
};

const expandMatrixCascade = (
  session: IcarusSessionWithWorkflowRecord,
  matrixIds: Set<string>,
  activityIds: Set<string>
) => {
  let changed = true;

  while (changed) {
    changed = false;

    for (const activity of session.activities) {
      if (activityIds.has(activity.id)) continue;

      const consumesDeletedMatrix = [...getActivityMatrixInputs(activity)].some(
        (matrixId) => matrixIds.has(matrixId)
      );
      const producesDeletedMatrix = Boolean(
        activity.outputMatrixReference &&
          matrixIds.has(activity.outputMatrixReference)
      );

      if (consumesDeletedMatrix || producesDeletedMatrix) {
        activityIds.add(activity.id);
        changed = true;
      }
    }

    for (const activity of session.activities) {
      if (!activityIds.has(activity.id)) continue;
      const outputMatrixId = activity.outputMatrixReference;

      if (
        outputMatrixId &&
        session.matrixIds.includes(outputMatrixId) &&
        !matrixIds.has(outputMatrixId)
      ) {
        matrixIds.add(outputMatrixId);
        changed = true;
      }
    }
  }
};

const collectCascadingVisualizations = (
  session: IcarusSessionWithWorkflowRecord,
  matrixIds: Set<string>,
  activityIds: Set<string>
) => {
  const visualizationIds = new Set<string>();

  session.visualizations.forEach((visualization) => {
    const referencesDeletedMatrix = [
      ...getVisualizationReferencedMatrixIds(visualization),
    ].some((matrixId) => matrixIds.has(matrixId));
    const createdByDeletedActivity = Boolean(
      visualization.createdByActivityId &&
        activityIds.has(visualization.createdByActivityId)
    );

    if (referencesDeletedMatrix || createdByDeletedActivity) {
      visualizationIds.add(visualization.id);
    }
  });

  return visualizationIds;
};

export const planMatrixDeletion = (
  session: IcarusSessionWithWorkflowRecord,
  matrixId: string
): DeletionPlan => {
  requireSessionRecord(session, "matrix", matrixId);

  const directDependentActivityIds = session.activities
    .filter((activity) => getActivityMatrixInputs(activity).has(matrixId))
    .map((activity) => activity.id);
  const directDependentVisualizationIds = session.visualizations
    .filter((visualization) =>
      getVisualizationReferencedMatrixIds(visualization).has(matrixId)
    )
    .map((visualization) => visualization.id);
  const matrixIds = new Set([matrixId]);
  const activityIds = new Set<string>();

  expandMatrixCascade(session, matrixIds, activityIds);
  const visualizationIds = collectCascadingVisualizations(
    session,
    matrixIds,
    activityIds
  );

  return {
    targetId: matrixId,
    targetType: "matrix",
    matrixIds: orderedIds(session.matrixIds, matrixIds),
    activityIds: orderedIds(session.activityIds, activityIds),
    visualizationIds: orderedIds(
      session.visualizationIds,
      visualizationIds
    ),
    dependentMatrixIds: orderedIds(session.matrixIds, matrixIds).filter(
      (id) => id !== matrixId
    ),
    directDependentActivityIds,
    directDependentVisualizationIds,
    isSourceMatrix:
      directDependentActivityIds.length > 0 ||
      directDependentVisualizationIds.length > 0,
  };
};

export const planActivityDeletion = (
  session: IcarusSessionWithWorkflowRecord,
  activityId: string
): DeletionPlan => {
  requireSessionRecord(session, "activity", activityId);

  const activityIds = new Set([activityId]);
  const matrixIds = new Set<string>();
  const activity = session.activities.find((item) => item.id === activityId);
  if (
    activity?.outputMatrixReference &&
    session.matrixIds.includes(activity.outputMatrixReference)
  ) {
    matrixIds.add(activity.outputMatrixReference);
  }

  expandMatrixCascade(session, matrixIds, activityIds);
  const visualizationIds = collectCascadingVisualizations(
    session,
    matrixIds,
    activityIds
  );

  return {
    targetId: activityId,
    targetType: "activity",
    matrixIds: orderedIds(session.matrixIds, matrixIds),
    activityIds: orderedIds(session.activityIds, activityIds),
    visualizationIds: orderedIds(
      session.visualizationIds,
      visualizationIds
    ),
    dependentMatrixIds: orderedIds(session.matrixIds, matrixIds),
    directDependentActivityIds: [],
    directDependentVisualizationIds: session.visualizations
      .filter((visualization) => visualization.createdByActivityId === activityId)
      .map((visualization) => visualization.id),
    isSourceMatrix: false,
  };
};

export const planVisualizationDeletion = (
  session: IcarusSessionWithWorkflowRecord,
  visualizationId: string
): DeletionPlan => {
  requireSessionRecord(session, "visualization", visualizationId);

  const visualization = session.visualizations.find(
    (item) => item.id === visualizationId
  );
  const activityIds = new Set<string>();

  if (visualization?.createdByActivityId) {
    const creator = session.activities.find(
      (activity) => activity.id === visualization.createdByActivityId
    );
    const otherVisualizationsFromCreator = session.visualizations.some(
      (item) =>
        item.id !== visualizationId &&
        item.createdByActivityId === visualization.createdByActivityId
    );
    const isDedicatedVisualizationActivity = Boolean(
      creator &&
        !creator.outputMatrixReference &&
        (creator.pluginId === "visualization-engine" ||
          creator.name.startsWith("visualization--"))
    );

    if (isDedicatedVisualizationActivity && !otherVisualizationsFromCreator) {
      activityIds.add(visualization.createdByActivityId);
    }
  }

  return {
    targetId: visualizationId,
    targetType: "visualization",
    matrixIds: [],
    activityIds: orderedIds(session.activityIds, activityIds),
    visualizationIds: [visualizationId],
    dependentMatrixIds: [],
    directDependentActivityIds: [],
    directDependentVisualizationIds: [],
    isSourceMatrix: false,
  };
};

export const assertDeletionPlanIntegrity = (
  session: IcarusSessionWithWorkflowRecord,
  plan: DeletionPlan
) => {
  const matrixIds = new Set(plan.matrixIds);
  const activityIds = new Set(plan.activityIds);

  for (const activity of session.activities) {
    if (activityIds.has(activity.id)) continue;

    const referencesDeletedMatrix = [...getActivityMatrixInputs(activity)].some(
      (matrixId) => matrixIds.has(matrixId)
    );
    const outputsDeletedMatrix = Boolean(
      activity.outputMatrixReference &&
        matrixIds.has(activity.outputMatrixReference)
    );
    if (referencesDeletedMatrix || outputsDeletedMatrix) {
      throw new Error(
        `Unsafe deletion plan: activity ${activity.id} would reference a deleted matrix`
      );
    }
  }

  for (const visualization of session.visualizations) {
    if (plan.visualizationIds.includes(visualization.id)) continue;

    const referencesDeletedMatrix = [
      ...getVisualizationReferencedMatrixIds(visualization),
    ].some((matrixId) => matrixIds.has(matrixId));
    const referencesDeletedActivity = Boolean(
      visualization.createdByActivityId &&
        activityIds.has(visualization.createdByActivityId)
    );
    if (referencesDeletedMatrix || referencesDeletedActivity) {
      throw new Error(
        `Unsafe deletion plan: visualization ${visualization.id} would reference deleted data`
      );
    }
  }
};

export const hasSameDeletionScope = (
  currentPlan: DeletionPlan,
  confirmedPlan: DeletionPlan
) => {
  const sameIds = (left: string[], right: string[]) =>
    left.length === right.length && left.every((id) => right.includes(id));

  return (
    currentPlan.targetId === confirmedPlan.targetId &&
    currentPlan.targetType === confirmedPlan.targetType &&
    sameIds(currentPlan.matrixIds, confirmedPlan.matrixIds) &&
    sameIds(currentPlan.activityIds, confirmedPlan.activityIds) &&
    sameIds(currentPlan.visualizationIds, confirmedPlan.visualizationIds)
  );
};

export const getPhysicalDeletionScope = ({
  plan,
  sessionId,
  sessions,
  activities,
  visualizations,
}: {
  plan: DeletionPlan;
  sessionId: string;
  sessions: IcarusSessionRecord[];
  activities: IcarusActivityRecord[];
  visualizations: IcarusVisualizationRecord[];
}): PhysicalDeletionScope => {
  const otherSessions = sessions.filter((session) => session.id !== sessionId);
  const isReferencedByAnotherSession = (
    id: string,
    key: "matrixIds" | "activityIds" | "visualizationIds"
  ) => otherSessions.some((session) => session[key]?.includes(id));

  const visualizationIds = plan.visualizationIds.filter(
    (id) => !isReferencedByAnotherSession(id, "visualizationIds")
  );
  const visualizationDeletionSet = new Set(visualizationIds);
  const activityIds = plan.activityIds
    .filter((id) => !isReferencedByAnotherSession(id, "activityIds"))
    .filter(
      (id) =>
        !visualizations.some(
          (visualization) =>
            !visualizationDeletionSet.has(visualization.id) &&
            visualization.createdByActivityId === id
        )
    );
  const activityDeletionSet = new Set(activityIds);
  const matrixIds = plan.matrixIds
    .filter((id) => !isReferencedByAnotherSession(id, "matrixIds"))
    .filter(
      (id) =>
        !activities.some(
          (activity) =>
            !activityDeletionSet.has(activity.id) &&
            getActivityReferencedMatrixIds(activity).has(id)
        ) &&
        !visualizations.some(
          (visualization) =>
            !visualizationDeletionSet.has(visualization.id) &&
            getVisualizationReferencedMatrixIds(visualization).has(id)
        )
    );

  return { matrixIds, activityIds, visualizationIds };
};
