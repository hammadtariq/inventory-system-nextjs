import { useEffect, useMemo, useState } from "react";

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
          {value1}
          {valueKey2 ? <span className={styles.value2Color}>({value2})</span> : null}
        </div>
      ),
    };
  });

const SearchInput = ({ handleSearch, handleSelect, valueKey, valueKey2, placeholder, type, defaultValue }) => {
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState(defaultValue || "");

  useEffect(() => {
    setInputValue(defaultValue || "");
  }, [defaultValue]);

  const debouncedSearch = useMemo(
    () =>
      _debounce(async (value) => {
        if (value) {
          const results = await handleSearch(value.toLowerCase());
          setOptions(searchResult(results, valueKey, valueKey2, type));
        } else {
          handleSearch();
          setOptions([]);
        }
      }, 500),
    [handleSearch, type, valueKey, valueKey2]
  );

  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  const _handleSelect = (displayValue, option) => {
    const id = option.key;
    setInputValue(displayValue);
    setOptions([]);
    handleSelect(id, displayValue);
  };

  const handleChange = (value) => {
    setInputValue(value || "");
  };

  return (
    <Space.Compact size="large" className={styles.inputWrap}>
      <AutoComplete
        popupMatchSelectWidth={500}
        style={{ width: "100%" }}
        options={options}
        onSelect={_handleSelect}
        onSearch={debouncedSearch}
        onChange={handleChange}
        value={inputValue}
        placeholder={placeholder}
        allowClear
      />
      <Button type="primary" icon={<SearchOutlined />} />
    </Space.Compact>
  );
};

export default SearchInput;
