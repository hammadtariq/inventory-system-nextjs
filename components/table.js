import { useState } from "react";
import { Table } from "antd";

export default function AppTable({
  bordered,
  isLoading,
  rowKey,
  columns,
  dataSource,
  expandable,
  className,
  pagination,
  paginationHandler,
  rowClassName,
  components,
}) {
  const [total, setTotal] = useState();
  const pageOptions = ["10", "20", "30", "50"];

  const handleChange = (pagination) => {
    const offset = pagination.current * pagination.pageSize - pagination.pageSize;
    const limit = pagination.pageSize;
    setTotal(pagination.total);
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
      pagination={
        pagination
          ? { defaultPageSize: pageOptions[0], showSizeChanger: true, pageSizeOptions: pageOptions, total: total }
          : pagination
      }
      onChange={handleChange}
    />
  );
}
