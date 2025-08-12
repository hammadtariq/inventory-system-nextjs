import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin, Table } from "antd";
import { useEffect, useState } from "react";

const pageOptions = ["30", "50", "100", "150", "200"];

const loader = <Spin indicator={<LoadingOutlined spin />} size="large" />;

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
  pagination,
  rowClassName,
  footer,
  components,
}) {
  const [tableParams, setTableParams] = useState({
    pagination: {
      currentPageNumber: 1,
      pageSize: DEFAULT_PAGE_LIMIT,
    },
  });

  useEffect(() => {
    if (pagination) {
      setTableParams({
        pagination: {
          currentPageNumber: pagination.pageNumber || 1,
          pageSize: pagination.limit || DEFAULT_PAGE_LIMIT,
        },
      });
    }
  }, [pagination]);

  const handleChange = ({ current, pageSize }) => {
    const offset = (current - 1) * pageSize;
    const limit = pageSize;

    setTableParams({
      pagination: {
        currentPageNumber: current,
        pageSize,
      },
    });

    paginationHandler(limit, offset, current);
  };

  const paginationConfig = {
    pageSize: tableParams.pagination.pageSize,
    showSizeChanger: true,
    pageSizeOptions: pageOptions,
    total: totalCount,
    current: tableParams.pagination.currentPageNumber,
  };

  return (
    <Table
      bordered={bordered}
      scroll={{ x: "max-content" }}
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
      loading={{
        spinning: isLoading ?? false,
        indicator: loader,
      }}
    />
  );
}
