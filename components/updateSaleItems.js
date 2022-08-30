import React, { useEffect, useState } from "react";

import { Button, Form, Popconfirm, Typography } from "antd";

import EditableCell from "@/components/editableCell";
import styles from "@/styles/EditableCell.module.css";

import AppTable from "./table";

export default function UpdateSalesItems({
  setSelectedProducts,
  data,
  updatedProducts,
  setUpdatedProducts,
  viewOnly = false,
}) {
  const [editingKey, setEditingKey] = useState([]);
  const [editAll, setEditAll] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (editAll) {
      data.forEach((record) => {
        edit(record);
        setEditingKey((prev) => {
          return [...prev, record.key];
        });
      });
    }
  }, [editAll]);

  const isEditing = (record) => {
    return editingKey.includes(record.key);
  };

  const edit = (record) => {
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
  };

  const cancel = () => {
    setEditingKey([]);
    setEditAll(false);
  };

  const saveAll = async () => {
    try {
      const row = await form.validateFields();

      const arrayOfObj = [];

      Object.entries(row).map((item) => {
        arrayOfObj.push({ ...item[1], key: Number(item[0]) });
      });
      const newData = [...data];
      const updatedData = [...updatedProducts];
      arrayOfObj.forEach((rec) => {
        saveIndividual(rec.key, newData, setSelectedProducts, rec);
        saveIndividual(rec.key, updatedData, setUpdatedProducts, rec);
      });
      setEditAll(false);
      setEditingKey([]);
    } catch (error) {
      console.log("Validate Failed:", error);
    }
  };

  const save = async (key, row) => {
    try {
      const newData = [...data];
      const updatedData = [...updatedProducts];
      saveIndividual(key, newData, setSelectedProducts, row);
      saveIndividual(key, updatedData, setUpdatedProducts, row);
    } catch (errInfo) {
      console.log("Validate Failed:", errInfo);
    }
  };

  const saveIndividual = (key, data, setData, row) => {
    const newData = [...data];
    const index = newData.findIndex((item) => key === item.id);
    if (index > -1) {
      const item = newData[index];
      newData.splice(index, 1, { ...item, ...row });
      setData(newData);
    } else {
      newData.push(row);
      setData(newData);
    }
  };

  // const getOperationColumn = () => {
  //   return {
  //     title: "operation",
  //     dataIndex: "operation",
  //     render: (_, record) => {
  //       const editable = isEditing(record);
  //       return editable ? (
  //         <span>
  //           <Typography.Link
  //             onClick={() => save(record.id)}
  //             style={{
  //               marginRight: 8,
  //             }}
  //           >
  //             Save
  //           </Typography.Link>
  //           <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
  //             <a>Cancel</a>
  //           </Popconfirm>
  //         </span>
  //       ) : (
  //         <Typography.Link disabled={editingKey !== ""} onClick={() => edit(record)}>
  //           Edit
  //         </Typography.Link>
  //       );
  //     },
  //   };
  // };

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
      title: "Rate Per Bale",
      dataIndex: "ratePerBale",
      width: "10%",
      editable: true,
      required: false,
    },
  ];

  // if (!viewOnly) columns.push(getOperationColumn());

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
      </div>
      <Form form={form} component={false}>
        <AppTable
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
    </>
  );
}
