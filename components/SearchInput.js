import { useState } from "react";

import { AutoComplete, Input } from "antd";
import _debounce from "lodash/debounce";

import styles from "@/styles/SearchInput.module.css";

const { Search } = Input;
const Option = AutoComplete.Option;
const searchResult = (results = [], valueKey = "") =>
  results.map((result) => {
    return {
      value: result[valueKey] + "-" + result.id,
      label: (
        <div key={result.id} className={styles.listItem}>
          {result[valueKey]}
        </div>
      ),
    };
  });

const SearchInput = ({ handleSearch, handleSelect, valueKey }) => {
  const [results, setResults] = useState([]);
  const _handleSearch = async (value) => {
    if (value) {
      value = value;
      const results = await handleSearch(value.toLowerCase());
      setResults(results);
      // setOptions(searchResult(results, valueKey));
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
        onSelect={_handleSelect}
        onSearch={_debounce(_handleSearch, 500)}
        style={{
          width: 200,
        }}
      >
        {results.map((result) => (
          <Option key={result.id} value={result[valueKey]}>
            {result[valueKey]}
          </Option>
        ))}
        {/* <Search size="large" placeholder="Search inventory" allowClear enterButton /> */}
      </AutoComplete>
    </>
  );
};

export default SearchInput;
