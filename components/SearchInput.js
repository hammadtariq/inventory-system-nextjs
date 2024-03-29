import { useState } from "react";

import { AutoComplete, Input } from "antd";
import _debounce from "lodash/debounce";

import styles from "@/styles/SearchInput.module.css";

const { Search } = Input;

const searchResult = (results = [], valueKey = "", valueKey2 = "") =>
  results.map((result) => ({
    value: valueKey2 ? result[valueKey] + " " + result[valueKey2] : result[valueKey],
    key: result.id,
    label: (
      <div className={styles.listItem}>{valueKey2 ? result[valueKey] + " " + result[valueKey2] : result[valueKey]}</div>
    ),
  }));

const SearchInput = ({ handleSearch, handleSelect, valueKey, valueKey2, placeholder }) => {
  const [options, setOptions] = useState([]);

  const _handleSearch = async (value) => {
    console.log("_handleSearch", value);
    if (value) {
      const results = await handleSearch(value.toLowerCase());
      setOptions(searchResult(results, valueKey, valueKey2));
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
        dropdownMatchSelectWidth={252}
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
