import { useState } from "react";

import { AutoComplete, Input } from "antd";
import _debounce from "lodash/debounce";

import styles from "@/styles/SearchInput.module.css";

const { Search } = Input;

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

const SearchInput = ({ handleSearch, handleSelect, valueKey, valueKey2, placeholder, type }) => {
  const [options, setOptions] = useState([]);

  const _handleSearch = async (value) => {
    console.log("_handleSearch", value);
    if (value) {
      const results = await handleSearch(value.toLowerCase());
      setOptions(searchResult(results, valueKey, valueKey2, type));
    } else {
      handleSearch();
    }
    return value;
  };

  const _handleSelect = (itemId, option) => {
    const id = option.key;
    handleSelect(id);
  };

  return (
    <>
      <AutoComplete
        popupMatchSelectWidth={500}
        className={styles.inputWrap}
        options={options}
        onSelect={_handleSelect}
        onSearch={_debounce(_handleSearch, 500)}
      >
        <Search size="large" placeholder={placeholder} loading={false} allowClear enterButton />
      </AutoComplete>
    </>
  );
};

export default SearchInput;
