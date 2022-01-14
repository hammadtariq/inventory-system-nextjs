import { Table } from "antd";

export default function AppTable({ isLoading, rowKey, columns, dataSource, expandable, className, pagination }) {
  return (
    <Table
      scroll={{ x: 1000 }}
      loading={isLoading}
      rowKey={rowKey || "id"}
      columns={columns}
      dataSource={dataSource}
      expandable={expandable}
      className={className}
      pagination={pagination}
    />
  );
}
