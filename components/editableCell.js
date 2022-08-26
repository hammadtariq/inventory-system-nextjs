import React from "react";

import { Form, Input, InputNumber } from "antd";

import styles from "@/styles/EditableCell.module.css";

const EditableCell = ({
  editing,
  handleFormValues,
  dataIndex,
  title,
  inputType,
  children,
  required,
  record,
  ...restProps
}) => {
  const handleChange = (e, name) => {
    const data = { e, name };
    handleFormValues(data);
  };
  const inputNode =
    inputType === "number" ? (
      <InputNumber name={dataIndex} className={styles.editableCellInput} onChange={(e) => handleChange(e, dataIndex)} />
    ) : (
      <Input name={dataIndex} className={styles.editableCellInput} onChange={(e) => handleChange(e, dataIndex)} />
    );
  return (
    <td {...restProps} className={styles.editableTd}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{
            margin: 0,
          }}
          rules={[
            {
              required,
              message: `Please Input ${title}!`,
            },
            {
              type: "number",
              max: dataIndex === "noOfBales" ? record.onHand : null,
              message: `${title} cannot be greater than ${record.onHand}`,
            },
          ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

export default EditableCell;
