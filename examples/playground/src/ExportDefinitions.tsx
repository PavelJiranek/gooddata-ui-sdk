// (C) 2022-2024 GoodData Corporation
import { idRef, IExportDefinition } from "@gooddata/sdk-model";
import { useBackendStrict, useWorkspaceStrict } from "@gooddata/sdk-ui";
import React, { ChangeEventHandler, useCallback, useEffect, useMemo, useState } from "react";
import {
    ExportDefinitionOrdering,
    ExportDefinitionQuerySort,
    IExportDefinitionsQueryOptions,
} from "@gooddata/sdk-backend-spi";

export const ExportDefinitions = () => {
    const backend = useBackendStrict();
    const ws = useWorkspaceStrict();

    const [exportDefinitions, setExportDefinitions] = useState<IExportDefinition[]>([]);

    const [loading, setLoading] = useState(false);

    const getExportDefinitions = useCallback(
        async (options?: IExportDefinitionsQueryOptions) => {
            const result = await backend.workspace(ws).exportDefinitions().getExportDefinitions(options);
            setExportDefinitions(result.items);
        },
        [backend, ws],
    );

    useEffect(() => {
        setLoading(true);
        (async () => {
            await getExportDefinitions();
        })();
    }, [backend, getExportDefinitions, ws]);

    const [activeEdId, setActiveEdId] = useState("");

    useEffect(() => {
        if (!activeEdId) {
            setActiveEdId(exportDefinitions[0]?.id || "");
        }
    }, [activeEdId, exportDefinitions]);

    const [newEdName, setNewEdName] = useState("My ED");
    const [toUpdateEdName, setToUpdateEdName] = useState("My updated ED");
    const handleCreateED = useCallback(() => {
        setLoading(true);
        backend
            .workspace(ws)
            .exportDefinitions()
            .createExportDefinition({
                title: newEdName,
                description: "My ED description",
                tags: ["tag1", "tag2"],
                requestPayload: {
                    format: "PDF",
                    visualizationObjectId: "d360e59b-0764-4445-9fd3-88cc5eedd3d6", // pji on demo cloud
                    // visualizationObjectId: "b3b665b7-bca2-0322-82f1-b86ky73k90f8afe", // staging
                },
            })
            .then(async (_result) => {
                await getExportDefinitions();
                setLoading(false);
            });
    }, [backend, newEdName, getExportDefinitions, ws]);

    const activeEd = useMemo(
        () => exportDefinitions.find((ed) => ed.id === activeEdId),
        [activeEdId, exportDefinitions],
    );
    const handleUpdateED = useCallback(() => {
        if (!activeEd) {
            return;
        }
        setLoading(true);
        backend
            .workspace(ws)
            .exportDefinitions()
            .updateExportDefinition(idRef(activeEdId), {
                ...activeEd,
                title: toUpdateEdName,
            })
            .then(async (_result) => {
                await getExportDefinitions();
                setLoading(false);
            });
    }, [activeEd, backend, ws, activeEdId, toUpdateEdName, getExportDefinitions]);

    const handleEdClick = useCallback(
        (edId: string) => () => {
            setActiveEdId(edId);
        },
        [],
    );

    const handleNewEdNameChange = useCallback<ChangeEventHandler<HTMLInputElement>>((e) => {
        setNewEdName(e.target.value);
    }, []);

    const handleToUpdateEdNameChange = useCallback<ChangeEventHandler<HTMLInputElement>>((e) => {
        setToUpdateEdName(e.target.value);
    }, []);

    const getEdNameAndTitle = (ed: IExportDefinition) => `Id: ${ed.id}, Title: ${ed.title}`;

    const handleEdSelect = useCallback<ChangeEventHandler<HTMLSelectElement>>((event) => {
        setActiveEdId(event.target.value);
    }, []);

    const [openDetail, setOpenDetail] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailEd, setDetailEd] = useState<IExportDefinition | null>(null);

    const handleShowEd = useCallback(
        (loadUserData?: boolean) => () => {
            setOpenDetail(true);
            setDetailLoading(true);
            backend
                .workspace(ws)
                .exportDefinitions()
                .getExportDefinition(idRef(activeEdId), { loadUserData })
                .then((result) => {
                    setDetailEd(result);
                    setDetailLoading(false);
                });
        },
        [activeEdId, backend, ws],
    );

    const [titleFilter, setTitleFilter] = useState("");
    const [authorFilter, setAuthorFilter] = useState("");
    const [loadUserData, setLoadUserData] = useState(false);
    const [limit, setLimit] = useState(50);
    const [offset, setOffset] = useState(0);
    const [size, setSize] = useState(50);
    const [page, setPage] = useState(0);
    const [orderBy, setOrderBy] = useState<ExportDefinitionOrdering | "none">("none");

    const getExportDefinitionsWithFilters = useCallback(async () => {
        setLoading(true);
        await getExportDefinitions({
            loadUserData,
            author: authorFilter,
            title: titleFilter,
            limit,
            offset,
            orderBy: orderBy !== "none" ? orderBy : undefined,
        });
    }, [authorFilter, getExportDefinitions, limit, loadUserData, offset, orderBy, titleFilter]);

    const [sortProps, setSortProps] = useState<ExportDefinitionQuerySort | undefined>(undefined);
    const getExportDefinitionsQuery = useCallback(async () => {
        const sort: ExportDefinitionQuerySort[] = (sortProps?.split(";") ||
            []) as ExportDefinitionQuerySort[];
        setLoading(true);
        const query = backend
            .workspace(ws)
            .exportDefinitions()
            .getExportDefinitionsQuery()
            .withFilter({ title: titleFilter })
            .withSorting(sort)
            .withSize(size)
            .withPage(page);

        // Sorting criteria in the format: property,(asc|desc). Default sort order is ascending. Multiple sort criteria are supported.
        const result = await query.query();
        setExportDefinitions(result.items);
        setLoading(false);
    }, [backend, page, size, sortProps, titleFilter, ws]);

    // todo set sort from sort props state

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h1>ExportDefinitions</h1>

            <div>
                {loading ? <h2>Loading...</h2> : null}
                <div style={{ display: "flex", gap: "1rem", flexDirection: "column", alignItems: "start" }}>
                    <h2>Get all EDs</h2>
                    <label>
                        Filter by title:
                        <input
                            type="text"
                            placeholder="Filter by title"
                            value={titleFilter}
                            onChange={(e) => setTitleFilter(e.target.value)}
                        />
                    </label>
                    <label>
                        Filter by author:
                        <input
                            type="text"
                            placeholder="Filter by author"
                            value={authorFilter}
                            onChange={(e) => setAuthorFilter(e.target.value)}
                        />
                    </label>
                    <label>
                        Load user data:
                        <input
                            type="checkbox"
                            checked={loadUserData}
                            onChange={(e) => setLoadUserData(e.target.checked)}
                        />
                    </label>
                    <label>
                        Limit:
                        <input
                            type="number"
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}
                        />
                    </label>
                    <label>
                        Offset:
                        <input
                            type="number"
                            value={offset}
                            onChange={(e) => setOffset(Number(e.target.value))}
                        />
                    </label>
                    <label>
                        Order by:
                        <select
                            value={orderBy}
                            onChange={(e) => setOrderBy(e.target.value as ExportDefinitionOrdering)}
                        >
                            <option value={"none"}>None</option>
                            <option value="id">Id</option>
                            <option value="title">Title</option>
                            <option value="updated">Updated</option>
                        </select>
                    </label>
                    <button onClick={getExportDefinitionsWithFilters}>Get Export Definitions</button>
                    <hr />
                    <label>
                        Page size:
                        <input type="number" value={size} onChange={(e) => setSize(Number(e.target.value))} />
                    </label>
                    <label>
                        Page:
                        <input type="number" value={page} onChange={(e) => setPage(Number(e.target.value))} />
                    </label>
                    <label>
                        Sort props:
                        <input
                            type="text"
                            value={sortProps}
                            onChange={(e) => setSortProps(e.target.value as ExportDefinitionQuerySort)}
                        />
                    </label>
                    <button onClick={getExportDefinitionsQuery}>
                        Get Export Definitions Paginated Query
                    </button>
                </div>
                <hr />
                <h2>Get a single ED</h2>
                <button onClick={handleShowEd()}>Show Export Definition</button>
                <button onClick={handleShowEd(true)}>Show Export Definition with User Data</button>
                <dialog open={openDetail}>
                    <h2>Export Definition</h2>
                    {detailLoading ? (
                        <h3>Loading...</h3>
                    ) : (
                        <div>
                            <h3>{detailEd?.title}</h3>
                            <pre>{JSON.stringify(detailEd, null, 2)}</pre>
                            <button onClick={() => setOpenDetail(false)}>Close</button>
                        </div>
                    )}
                </dialog>
                <hr />
                <h2>Create ED</h2>
                <input onChange={handleNewEdNameChange} />
                <button onClick={handleCreateED}>Create ED</button>
                <hr />
                <div>
                    {exportDefinitions.map((ed) => (
                        <div key={ed.id} style={{ padding: "1rem" }}>
                            <button onClick={handleEdClick(ed.id)}>{getEdNameAndTitle(ed)}</button>
                            {activeEdId === ed.id && <pre>{JSON.stringify(ed, null, 2)}</pre>}
                        </div>
                    ))}
                </div>
                <hr />
                <h2>Update ED</h2>
                <select value={activeEdId} onChange={handleEdSelect}>
                    {exportDefinitions.map((ed) => (
                        <option key={ed.id} value={ed.id}>
                            {getEdNameAndTitle(ed)}
                        </option>
                    ))}
                </select>
                <input value={toUpdateEdName} onChange={handleToUpdateEdNameChange} />
                <button disabled={!activeEdId} onClick={handleUpdateED}>
                    Update ED
                </button>
                <hr />
                <h3>Delete ED</h3>
                <button
                    onClick={async () => {
                        setLoading(true);
                        await backend
                            .workspace(ws)
                            .exportDefinitions()
                            .deleteExportDefinition(idRef(activeEdId));
                        await getExportDefinitions();
                        setLoading(false);
                    }}
                    disabled={!activeEdId}
                >
                    Delete {activeEd ? getEdNameAndTitle(activeEd) : ""}
                </button>
                <hr />
                <div style={{ padding: "4rem" }}>
                    <pre>{JSON.stringify(exportDefinitions, null, 2)}</pre>
                </div>
                <hr />
            </div>
        </div>
    );
};
