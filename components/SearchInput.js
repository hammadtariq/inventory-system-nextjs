import { useState } from "react";

import { AutoComplete, Input } from "antd";
import _debounce from "lodash/debounce";

import styles from "@/styles/SearchInput.module.css";

const { Search } = Input;

const searchResult = (results = [], valueKey = "") =>
  results.map((result) => ({
    value: result[valueKey],
    label: (
      <div key={result.id} className={styles.listItem}>
        {result[valueKey]}
      </div>
    ),
  }));

const SearchInput = ({ handleSearch, handleSelect, valueKey }) => {
  const [options, setOptions] = useState([]);

  const _handleSearch = async (value) => {
    console.log("_handleSearch", value);
    if (value) {
      const results = await handleSearch(value.toLowerCase());
      setOptions(searchResult(results, valueKey));
    } else {
      handleSearch();
    }
    return value;
  };

  const _handleSelect = (itemId, option) => {
    const id = option.label.key;
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
        <Search size="large" placeholder="Search inventory" loading={false} allowClear enterButton />
      </AutoComplete>
    </>
  );
};

export default SearchInput;
