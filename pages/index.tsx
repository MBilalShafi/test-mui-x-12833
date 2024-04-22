import * as React from 'react';
import { unstable_debounce as debounce } from '@mui/utils';
import {
  DataGridPremium,
  GridFetchRowsParams,
  useGridApiRef,
  GridEditModes,
} from '@mui/x-data-grid-premium';
import { createFakeServer, loadServerRows, UseDemoDataOptions } from '@mui/x-data-grid-generator';

const DATASET_OPTION: UseDemoDataOptions = {
  dataSet: 'Employee',
  rowLength: 10000,
};

const { columnsWithDefaultColDef, useQuery, ...data } = createFakeServer(DATASET_OPTION);

const emptyObject = {};

export default function LazyLoadingGrid() {
  // dataServerSide simulates your database.
  const { rows: rowsServerSide } = useQuery(emptyObject);
  const [finalCols, setFinalCols] = React.useState([]);
  const apiRef = useGridApiRef();
  const [initialRows, setInitialRows] = React.useState<typeof rowsServerSide>([]);
  const [rowCount, setRowCount] = React.useState(0);

  const fetchRow = React.useCallback(
    async (params: GridFetchRowsParams) => {
      const serverRows = await loadServerRows(
        rowsServerSide,
        {
          filterModel: params.filterModel,
          sortModel: params.sortModel,
        },
        {
          minDelay: 300,
          maxDelay: 800,
          useCursorPagination: false,
        },
        columnsWithDefaultColDef,
      );

      return {
        slice: serverRows.returnedRows.slice(params.firstRowToRender, params.lastRowToRender),
        total: serverRows.returnedRows.length,
      };
    },
    [rowsServerSide],
  );

  // The initial fetch request of the viewport.
  React.useEffect(() => {
    if (rowsServerSide.length === 0) {
      return;
    }

    (async () => {
      const { slice, total } = await fetchRow({
        firstRowToRender: 0,
        lastRowToRender: 10,
        sortModel: [],
        filterModel: {
          items: [],
        },
      });

      setInitialRows(slice.slice(1, 10));
      setRowCount(10);
    })();
  }, [rowsServerSide, fetchRow]);

  // Fetch rows as they become visible in the viewport
  const handleFetchRows = React.useCallback(
    async (params: GridFetchRowsParams) => {
      // NOT NEEDED AS MY TABLE HAS NO MORE ROWS
      return;
      const { slice, total } = await fetchRow(params);

      apiRef.current.unstable_replaceRows(params.firstRowToRender, slice);
      setRowCount(total);
    },
    [apiRef, fetchRow],
  );

  React.useEffect(() => {
    if (!initialRows?.length || initialRows?.length === 3) {
      return;
    }
    setTimeout(() => {
      const rows = initialRows?.slice(0, 3);
      setInitialRows(rows);
    }, 3000);

    apiRef?.current?.updateRows(initialRows);
  }, [initialRows]);

  // In my case final row count is set based on the total returned from the DB
  // in a separate useeffect similar to this
  React.useEffect(() => {
    if (initialRows?.length === rowCount) {
      return;
    }
    // This is getting set correctly but the UI does not update
    // And I cannot get rid of the loading rows
    setRowCount(initialRows?.length);
  }, [initialRows]);

  // In my app the columns are set dynamically after a network request
  React.useEffect(() => {
    setTimeout(() => {
      setFinalCols(data.columns);
    }, 1000);
  }, [data]);

  const debouncedHandleFetchRows = React.useMemo(
    () => debounce(handleFetchRows, 200),
    [handleFetchRows],
  );

  return (
    <div style={{ height: 400, width: '100%' }}>
      <DataGridPremium
        rows={initialRows}
        columns={finalCols}
        apiRef={apiRef}
        hideFooterPagination
        rowCount={rowCount}
        sortingMode="server"
        filterMode="server"
        rowsLoadingMode="server"
        onFetchRows={debouncedHandleFetchRows}
        columnHeaderHeight={initialRows?.length === 0 ? 0 : 50}
        showCellVerticalBorder={false}
        showColumnRightBorder={false}
        editMode={GridEditModes.Cell}
        sortingOrder={['desc', 'asc']}
        logLevel="debug"
        checkboxSelection
        disableRowSelectionOnClick
      />
    </div>
  );
}
