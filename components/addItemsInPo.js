import React, { useEffect, useState } from "react";
import { Popconfirm, Typography, Table, Form, Alert } from "antd";

import { useItemsByCompanyIdAndType } from "@/hooks/items";
import EditableCell from "@/components/editableCell";
import styles from "@/styles/EditAbleTable.module.css";

export default function AddItemsInPo({ companyId, type, setData, data }) {
  const { items, isLoading, error } = useItemsByCompanyIdAndType(companyId, type);
  const [editingKey, setEditingKey] = useState("");
  const [form] = Form.useForm();

  useEffect(() => {
    setData(items);
  }, [items]);

  const isEditing = (record) => record.id === editingKey;

  const edit = (record) => {
    form.setFieldsValue({
      itemName: "",
      noOfBales: "",
      baleWeightLbs: "",
      baleWeightKgs: "",
      ratePerLbs: "",
      ratePerKgs: "",
      ...(type === "SMALL_BALES" && { ratePerBale: "" }),
      ...record,
    });
    setEditingKey(record.id);
  };

  const cancel = () => {
    setEditingKey("");
  };

  const save = async (key) => {
    try {
      const row = await form.validateFields();
      const newData = [...data];
      const index = newData.findIndex((item) => key === item.id);

      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, { ...item, ...row });
        setData(newData);
        setEditingKey("");
      } else {
        newData.push(row);
        setData(newData);
        setEditingKey("");
      }
    } catch (errInfo) {
      console.log("Validate Failed:", errInfo);
    }
  };

  const columns = [
    {
      title: "Item Name",
      dataIndex: "itemName",
      width: "15%",
      editable: false,
    },
    {
      title: "No of Bales",
      dataIndex: "noOfBales",
      width: "17%",
      editable: true,
      required: true,
    },
    {
      title: "Bale Weight (LBS)",
      dataIndex: "baleWeightLbs",
      width: "10%",
      editable: true,
      required: false,
    },
    {
      title: "Bale Weight (KGS)",
      dataIndex: "baleWeightKgs",
      width: "10%",
      editable: true,
      required: false,
    },
    {
      title: "Rate per (LBS)",
      dataIndex: "ratePerLbs",
      width: "10%",
      editable: true,
      required: false,
    },
    {
      title: "Rate Per (KGS)",
      dataIndex: "ratePerKgs",
      width: "10%",
      editable: true,
      required: false,
    },
    {
      title: "operation",
      dataIndex: "operation",
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <Typography.Link
              onClick={() => save(record.id)}
              style={{
                marginRight: 8,
              }}
            >
              Save
            </Typography.Link>
            <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
              <a>Cancel</a>
            </Popconfirm>
          </span>
        ) : (
          <Typography.Link disabled={editingKey !== ""} onClick={() => edit(record)}>
            Edit
          </Typography.Link>
        );
      },
    },
  ];
  if (type === "SMALL_BALES") {
    columns.splice(columns.length - 1, 0, {
      title: "Rate Per Bale",
      dataIndex: "ratePerBale",
      width: "17%",
      editable: true,
      required: true,
    });
  }
  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: "number",
        dataIndex: col.dataIndex,
        title: col.title,
        required: col.required,
        editing: isEditing(record),
      }),
    };
  });

  if (error) return <Alert message={error} type="error" />;

  return (
    <Form form={form} component={false}>
      <Table
        loading={isLoading}
        components={{
          body: {
            cell: EditableCell,
          },
        }}
        bordered
        dataSource={data}
        columns={mergedColumns}
        rowClassName={styles.editableRow}
      />
    </Form>
  );
}
