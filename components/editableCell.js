import React from "react";
import { Input, InputNumber, Form } from "antd";

import styles from "@/styles/EditAbleTable.module.css";

const EditableCell = ({ editing, dataIndex, title, inputType, children, required, ...restProps }) => {
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
