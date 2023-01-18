import { Table } from "antd";

const pageOptions = ["10", "20", "30", "50"];
const paginationOptions = { defaultPageSize: pageOptions[0], showSizeChanger: true, pageSizeOptions: pageOptions };

export default function AppTable({
  bordered,
  isLoading,
  rowKey,
  columns,
  dataSource,
  totalCount = 10,
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
    paginationHandler(limit, offset);
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
