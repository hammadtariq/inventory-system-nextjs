import { useEffect, useMemo, useState } from "react";

import { AutoComplete, Input } from "antd";
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
    setOptions([]);
    handleSelect(id, displayValue);
  };

  return (
    // key forces a clean remount when defaultValue changes (e.g. router.query param update)
    <AutoComplete
      key={defaultValue ?? ""}
      popupMatchSelectWidth
      className={styles.inputWrap}
      options={options}
      onSelect={_handleSelect}
      showSearch={{ onSearch: debouncedSearch, filterOption: false }}
    >
      <Input.Search
        size="large"
        placeholder={placeholder}
        defaultValue={defaultValue || ""}
        enterButton={<SearchOutlined />}
        allowClear
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
    </AutoComplete>
  );
};

export default SearchInput;
