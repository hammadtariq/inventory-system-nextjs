import { useState } from "react";
import { Input, AutoComplete } from "antd";
import _debounce from "lodash/debounce";
const { Search } = Input;

const searchResult = (results) =>
  results.map((result) => {
    return {
      value: result.itemName,
      label: (
        <div
          key={result.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            textDecoration: "capitalize",
          }}
        >
          {result.itemName}
        </div>
      ),
    };
  });

const SearchInput = ({ handleSearch }) => {
  const [options, setOptions] = useState([]);

  const _handleSearch = async (value) => {
    if (value) {
      const results = await handleSearch(value.toLowerCase());
      setOptions(searchResult(results || []));
    }
    return value;
  };

  const onSelect = (value) => {
    console.log("onSelect", value);
  };

  return (
    <>
      <AutoComplete
        dropdownMatchSelectWidth={252}
        style={{ width: 300 }}
        options={options}
        onSelect={onSelect}
        onSearch={_debounce(_handleSearch, 500)}
      >
        <Search size="large" placeholder="Search inventory" loading={false} allowClear enterButton />
      </AutoComplete>
    </>
  );
};

export default SearchInput;
