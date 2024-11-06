import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";
import { Table } from "antd";
import { useCallback, useMemo, useState } from "react";

const pageOptions = ["30", "50", "100", "150", "200"];

export default function AppTable({
  bordered,
  isLoading,
  rowKey,
  columns,
  dataSource,
  totalCount = 50, // Note: not in use yet
  expandable,
  className,
  paginationHandler,
  rowClassName,
  footer,
  components,
}) {
  const [currentPageSize, setCurrentPageSize] = useState(DEFAULT_PAGE_LIMIT);

  const handleChange = useCallback(
    (pagination) => {
      const { current, pageSize } = pagination;
      const offset = current * pageSize - pageSize;
      const limit = pageSize;
      setCurrentPageSize(pageSize);
      paginationHandler(limit, offset);
    },
    [paginationHandler]
  );

  const paginationConfig = useMemo(
    () => ({
      pageSize: currentPageSize,
      showSizeChanger: true,
      pageSizeOptions: pageOptions,
      total: totalCount,
    }),
    [currentPageSize, totalCount]
  );

  return (
    <Table
      bordered={bordered}
      scroll={{ x: 1000 }}
      loading={isLoading}
      rowKey={rowKey || "id"}
      columns={columns}
      dataSource={dataSource}
      expandable={expandable}
      className={className}
      rowClassName={rowClassName}
      components={components}
      pagination={paginationHandler ? paginationConfig : false}
      onChange={handleChange}
      footer={footer}
    />
  );
}
