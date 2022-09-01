import React from "react";

import { Form, Input, InputNumber } from "antd";

import styles from "@/styles/EditableCell.module.css";
import { kgLbConversion } from "@/utils/conversion.utils";

const EditableCell = ({ dataIndex, title, inputType, editing, form, children, required, record, ...restProps }) => {
  const handleChange = (e, name, id) => {
    const data = { e, name, id };
    kgLbConversion(data, form);
  };
  const inputNode =
    inputType === "number" ? (
      <InputNumber
        name={dataIndex}
        className={styles.editableCellInput}
        onChange={(e) => handleChange(e, dataIndex, record.id)}
      />
    ) : (
      <Input
        name={dataIndex}
        className={styles.editableCellInput}
        onChange={(e) => handleChange(e, dataIndex, record.id)}
      />
    );
  return (
    <td {...restProps} className={styles.editableTd}>
      {editing ? (
        <Form.Item
          name={[record.id, dataIndex]}
          initialValue={record[dataIndex]}
          key={record.key}
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
