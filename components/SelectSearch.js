import React, { useState } from "react";
import { Select, Space, Tooltip } from "antd";
import styles from "@/styles/SelectSearch.module.css";

const SelectSearch = ({ onChange, options, placeholder }) => {
  const [value, setValue] = useState([]);

  const handleChange = (selectedValues) => {
    // Find the full objects that correspond to the selected values
    const selectedObjects = options.filter((option) => selectedValues.includes(option.value));

    setValue(selectedValues);
    // Pass the full selected objects to the onChange handler
    onChange?.(selectedObjects);
  };

  return (
    <Space direction="vertical" className={styles.parentContainer}>
      <Select
        mode="multiple"
        className={styles.childContainer}
        options={options}
        showSearch={false}
        value={value}
        placeholder={placeholder}
        maxTagCount="responsive"
        onChange={handleChange}
        maxTagPlaceholder={(omittedValues) => (
          <Tooltip
            overlayStyle={{
              pointerEvents: "none",
            }}
            title={omittedValues.map(({ label }) => label).join(", ")}
          >
            <span>Hover Me</span>
          </Tooltip>
        )}
      />
    </Space>
  );
};

export default SelectSearch;
