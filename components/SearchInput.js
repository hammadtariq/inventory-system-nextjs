import { useMemo, useState } from "react";

import { AutoComplete } from "antd";
import _debounce from "lodash/debounce";

import styles from "@/styles/SearchInput.module.css";

const getValueFromPath = (obj, path) => path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);

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

const SearchInput = ({ handleSearch, handleSelect, valueKey, valueKey2, placeholder, type, defaultValue = "" }) => {
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState(defaultValue);

  const debouncedSearch = useMemo(
    () =>
      _debounce(async (value) => {
        if (value) {
          const results = await handleSearch(value.toLowerCase());
          setOptions(searchResult(results, valueKey, valueKey2, type));
        } else {
          setOptions([]);
          handleSearch();
        }
      }, 500),
    [handleSearch, type, valueKey, valueKey2]
  );

  const onChange = (value) => {
    setInputValue(value);
    debouncedSearch(value);
  };

  const onSelect = (displayValue, option) => {
    setInputValue(displayValue);
    setOptions([]);
    handleSelect(option.key, displayValue);
  };

  return (
    <AutoComplete
      popupMatchSelectWidth={true}
      className={styles.inputWrap}
      options={options}
      value={inputValue}
      onChange={onChange}
      onSelect={onSelect}
      placeholder={placeholder}
      allowClear
      onClear={() => {
        setInputValue("");
        setOptions([]);
        handleSearch();
      }}
    />
  );
};

export default SearchInput;
