import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";
import { Table } from "antd";

const pageOptions = ["30", "50", "100", "150", "200"];
const paginationOptions = { pageSize: DEFAULT_PAGE_LIMIT, showSizeChanger: true, pageSizeOptions: pageOptions };

export default function AppTable({
  bordered,
  isLoading,
  rowKey,
  columns,
  dataSource,
  totalCount = 50, // Note: not in use yet
  expandable,
  className,
  pagination = paginationOptions,
  paginationHandler,
  rowClassName,
  footer,
  components,
}) {
  const handleChange = (pagination) => {
    const offset = pagination.current * pagination.pageSize - pagination.pageSize;
    const limit = pagination.pageSize;
    const filters = pagination.filters;
    debugger;
    paginationHandler(limit, offset, filters);
  };

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
      pagination={paginationHandler ? { ...pagination, total: totalCount } : false}
      onChange={handleChange}
      footer={footer}
    />
  );
}
