import React, { useCallback, useEffect, useState } from "react";

import { Button, Form, Popconfirm } from "antd";

import EditableCell from "@/components/editableCell";
import styles from "@/styles/EditableCell.module.css";

import AppTable from "./table";

export default function UpdateSalesItems({
  setSelectedProducts,
  data,
  editAll,
  setEditAll,
  updatedProducts,
  setUpdatedProducts,
  viewOnly = false,
}) {
  const [editingKey, setEditingKey] = useState([]);

  const [form] = Form.useForm();

  const isEditing = (record) => {
    return editingKey.includes(record.id);
  };

  const edit = useCallback(
    (record) => {
      form.setFieldsValue({
        itemName: "",
        noOfBales: "",
        baleWeightLbs: "",
        baleWeightKgs: "",
        ratePerLbs: "",
        ratePerKgs: "",
        ratePerBale: "",
        ...record,
      });
    },
    [form]
  );

  useEffect(() => {
    if (editAll) {
      data.forEach((record) => {
        if (editingKey.includes(record.id)) {
          console.log("id exist");
          return;
        }
        edit(record);
        setEditingKey((prev) => {
          return [...prev, record.id];
        });
      });
    }
  }, [editAll, data, editingKey, edit]);

  const cancel = () => {
    setEditingKey([]);
    setEditAll(false);
  };

  const saveAll = async () => {
    try {
      const row = await form.validateFields();

      let newData = [...data];
      let updatedData = [...updatedProducts];

      for (const key in row) {
        if (Object.hasOwnProperty.call(row, key)) {
          const item = row[key];
          newData = saveIndividual(Number(key), newData, item);
          updatedData = saveIndividual(Number(key), updatedData, item);
        }
      }

      setSelectedProducts(newData);
      setUpdatedProducts(updatedData);
      setEditAll(false);
      setEditingKey([]);
    } catch (error) {
      console.log("Validate Failed:", error);
    }
  };

  const saveIndividual = (key, arr, row) => {
    const arrData = [...arr];
    const index = arrData.findIndex((item) => key === item.id);
    if (index > -1) {
      const item = arrData[index];
      arrData.splice(index, 1, { ...item, ...row });
      return arrData;
    } else {
      arrData.push(row);
      return arrData;
    }
  };

  // const getOperationColumn = () => {
  //   return {
  //     title: "operation",
  //     dataIndex: "operation",
  //     render: (_, record) => {
  //       const editable = isEditing(record);
  //     },
  //   };
  // };

  const columns = [
    {
      title: "Item Name",
      dataIndex: "itemName",
      width: "20%",
      editable: false,
    },
    {
      title: "No of Bales",
      dataIndex: "noOfBales",
      width: "12%",
      editable: true,
      required: true,
    },
    {
      title: "Bale Weight (LBS)",
      dataIndex: "baleWeightLbs",
      width: "14%",
      editable: true,
      required: false,
    },
    {
      title: "Bale Weight (KGS)",
      dataIndex: "baleWeightKgs",
      width: "14%",
      editable: true,
      required: false,
    },
    {
      title: "Rate per (LBS)",
      dataIndex: "ratePerLbs",
      width: "13%",
      editable: true,
      required: false,
    },
    {
      title: "Rate Per (KGS)",
      dataIndex: "ratePerKgs",
      width: "13%",
      editable: true,
      required: false,
    },
    {
      title: "Rate Per Bale",
      dataIndex: "ratePerBale",
      width: "14%",
      editable: true,
      required: false,
    },
  ];

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: "number",
        form: form,
        dataIndex: col.dataIndex,
        title: col.title,
        required: col.required,
        editing: isEditing(record),
      }),
    };
  });

  return (
    <>
      <div className="editAll">
        {viewOnly ? null : (
          <>
            {!editAll ? (
              <Button onClick={() => setEditAll(true)} type="primary">
                Edit All
              </Button>
            ) : (
              <>
                <Button className="saveAll" type="primary" onClick={saveAll}>
                  Save All
                </Button>
                <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
                  <Button>Cancel</Button>
                </Popconfirm>
              </>
            )}
          </>
        )}
      </div>
      <Form form={form} component={false}>
        <AppTable
          components={{
            body: {
              cell: EditableCell,
            },
          }}
          bordered
          scroll={false}
          dataSource={data}
          columns={mergedColumns}
          rowClassName={styles.editableRow}
        />
      </Form>
    </>
  );
}
