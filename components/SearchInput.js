import { useState } from "react";

import { AutoComplete, Button, Space } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import _debounce from "lodash/debounce";

import styles from "@/styles/SearchInput.module.css";

const getValueFromPath = (obj, path) => {
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
};

const searchResult = (results = [], valueKey = "", valueKey2 = "", type) =>
  results.map(({ id, [valueKey]: value1, ...rest }) => {
    const value2 = valueKey2 ? getValueFromPath(rest, valueKey2) : "";
    const value = valueKey2 ? `${value1} (${value2})` : value1;

    return {
      value,
      key: type === "item" ? value : id,
      label: (
        <div className={styles.listItem}>
          {valueKey2 ? (
            <>
              {value1} <span className={styles.value2Color}>({value2})</span>
            </>
          ) : (
            value1
          )}
        </div>
      ),
    };
  });

const SearchInput = ({ handleSearch, handleSelect, valueKey, valueKey2, placeholder, type, defaultValue }) => {
  const [options, setOptions] = useState([]);

  const _handleSearch = async (value) => {
    if (value) {
      const results = await handleSearch(value.toLowerCase());
      setOptions(searchResult(results, valueKey, valueKey2, type));
    } else {
      handleSearch();
    }
    return value;
  };

  const _handleSelect = (displayValue, option) => {
    const id = option.key;
    handleSelect(id, displayValue);
  };

  return (
    <Space.Compact size="large" className={styles.inputWrap}>
      <AutoComplete
        popupMatchSelectWidth={500}
        style={{ width: "100%" }}
        options={options}
        onSelect={_handleSelect}
        onSearch={_debounce(_handleSearch, 500)}
        placeholder={placeholder}
        defaultValue={defaultValue}
        allowClear
      />
      <Button type="primary" icon={<SearchOutlined />} />
    </Space.Compact>
  );
};

export default SearchInput;
