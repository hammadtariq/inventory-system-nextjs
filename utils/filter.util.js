import { Button, Input, Space, Select } from "antd";
import Highlighter from "react-highlight-words";
import { SearchOutlined } from "@ant-design/icons";

export const getColumnSearchProps = ({
  searchInput,
  dataIndex,
  searchText,
  searchedColumn,
  setSearchText,
  setSearchedColumn,
  dataIndexName = null,
  nested = false,
  parentDataIndex = null,
  selectOptions = [], // If selectOptions is provided, use Select, otherwise use Input
}) => {
  return {
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        {selectOptions.length > 0 ? (
          <Select
            ref={searchInput}
            mode="multiple"
            allowClear
            style={{ width: "100%", marginBottom: 8 }}
            placeholder={`Select ${dataIndexName ?? dataIndex}`}
            value={selectedKeys}
            onChange={(value) => setSelectedKeys(value ? [...value] : [])}
            onDropdownVisibleChange={(open) => {
              if (!open) {
                confirm();
                setSearchText(selectedKeys);
                setSearchedColumn(dataIndex);
              }
            }}
            options={selectOptions}
          />
        ) : (
          <Input
            ref={searchInput}
            placeholder={`Search ${dataIndexName ?? dataIndex}`}
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => {
              confirm();
              setSearchText(selectedKeys[0]);
              setSearchedColumn(dataIndex);
            }}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
        )}
        <Space>
          <Button
            type="primary"
            onClick={() => {
              confirm();
              setSearchText(selectOptions.length > 0 ? selectedKeys : selectedKeys[0]);
              setSearchedColumn(dataIndex);
            }}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => {
              clearFilters();
              setSearchText(selectOptions.length > 0 ? [] : "");
            }}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
    onFilter: (value, record) => {
      if (nested) {
        if (record[parentDataIndex] && record[parentDataIndex][dataIndex]) {
          if (Array.isArray(value)) {
            return value.some((v) =>
              record[parentDataIndex][dataIndex].toString().toLowerCase().includes(v.toLowerCase())
            );
          }
          return record[parentDataIndex][dataIndex].toString().toLowerCase().includes(value.toLowerCase());
        }
        return false;
      } else {
        if (Array.isArray(value)) {
          return value.some((v) => record[dataIndex].toString().toLowerCase().includes(v.toLowerCase()));
        }
        return record[dataIndex].toString().toLowerCase().includes(value.toLowerCase());
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={Array.isArray(searchText) ? searchText : [searchText]}
          autoEscape
          textToHighlight={text.toString()}
        />
      ) : (
        text
      ),
  };
};

export const selectSearchFilter = (input, option) => {
  return option.children.toLowerCase().includes(input.toLowerCase());
};
