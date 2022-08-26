import React from "react";

import { Form, Input, InputNumber } from "antd";

import styles from "@/styles/EditableCell.module.css";

const EditableCell = ({ editing, dataIndex, title, inputType, children, required, record, ...restProps }) => {
  const inputNode =
    inputType === "number" ? (
      <InputNumber className={styles.editableCellInput} />
    ) : (
      <Input className={styles.editableCellInput} />
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
