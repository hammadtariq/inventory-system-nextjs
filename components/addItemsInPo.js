import React, { useEffect, useState } from "react";

import { Alert, Button, Checkbox, Form, Popconfirm, Typography } from "antd";

import EditableCell from "@/components/editableCell";
import AppTable from "@/components/table";
import { useItemsByCompanyIdAndType } from "@/hooks/items";
import styles from "@/styles/EditableCell.module.css";
import { kgLbConversion } from "@/utils/conversion.utils";

export default function AddItemsInPo({
  companyId,
  type,
  setData,
  editAll,
  setEditAll,
  data,
  isEdit,
  viewOnly = false,
}) {
  const [editingKey, setEditingKey] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [form] = Form.useForm();
  const { items, isLoading, error } = useItemsByCompanyIdAndType(companyId, type, isEdit);

  useEffect(() => {
    if (!isEdit) {
      setData(items);
    }
  }, [items]);

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
      ...(type === "SMALL_BALES" && { ratePerBale: "" }),
      ...record,
    });
  };

  const cancel = () => {
    setEditingKey([]);
    setEditAll(false);
  };

  const remove = (record) => {
    const index = data.findIndex((item) => record.id === item.id);
    const newData = [...data];
    newData.splice(index, 1);
    setData(newData);
    setSelectedRowKeys((prev) => prev.filter((key) => key !== record.id));
  };

  const removeSelected = () => {
    const newData = data.filter((item) => !selectedRowKeys.includes(item.id));
    setData(newData);
    setSelectedRowKeys([]);
    setSelectAllChecked(false);
  };

  const saveAll = async () => {
    try {
      const row = await form.validateFields();

      for (const key in row) {
        if (Object.hasOwnProperty.call(row, key)) {
          const item = row[key];
          save(Number(key), item);
        }
      }

      setData(data);
      setEditAll(false);
      setEditingKey([]);
    } catch (error) {
      console.log("Validate Failed:", error);
    }
  };

  const save = async (key, row) => {
    try {
      const newData = [...data];

      const index = newData.findIndex((item) => key === item.id);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, { ...item, ...row });
        data = newData;
      } else {
        newData.push(row);
        data = newData;
      }
    } catch (errInfo) {
      console.log("Validate Failed:", errInfo);
    }
  };

  const handleSelectAll = (e) => {
    setSelectAllChecked(e.target.checked);
    setSelectedRowKeys(e.target.checked ? data.map((item) => item.id) : []);
  };

  const handleRowSelect = (selected, record) => {
    setSelectedRowKeys((prev) => {
      const updatedSelectedRowKeys = selected ? [...prev, record.id] : prev.filter((key) => key !== record.id);

      if (updatedSelectedRowKeys.length === data.length) {
        setSelectAllChecked(true);
      } else {
        setSelectAllChecked(false);
      }

      return updatedSelectedRowKeys;
    });
  };

  const getOperationColumn = () => {
    return {
      title: "operation",
      dataIndex: "operation",
      width: "20%",
      render: (_, record) => {
        const editable = isEditing(record);
        return <Typography.Link onClick={() => remove(record)}>Remove</Typography.Link>;
      },
    };
  };

  const getSelectAllColumn = () => ({
    title: (
      <Checkbox checked={selectAllChecked} onChange={handleSelectAll} disabled={data?.length === 0}>
        Select All
      </Checkbox>
    ),
    dataIndex: "operation",
    width: "10%",
    render: (_, record) => (
      <div className={styles.centerAlign}>
        <Checkbox
          checked={selectedRowKeys.includes(record.id)}
          onChange={(e) => handleRowSelect(e.target.checked, record)}
        />
      </div>
    ),
  });

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
  ];

  if (type === "SMALL_BALES") {
    columns.push({
      title: "Rate Per Bale",
      dataIndex: "ratePerBale",
      width: "17%",
      editable: true,
      required: true,
    });
  }

  if (!viewOnly) {
    columns.unshift(getSelectAllColumn());
    columns.push(getOperationColumn());
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
        form,
        title: col.title,
        required: col.required,
        editing: isEditing(record),
      }),
    };
  });

  if (error) return <Alert message={error} type="error" />;

  return (
    <>
      <div className="editAll">
        {viewOnly ? null : (
          <>
            {!editAll ? (
              <Button onClick={() => setEditAll(true)} type="primary" className={styles.marginRight}>
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
            <Button onClick={removeSelected} type="danger" disabled={selectedRowKeys.length === 0}>
              Remove Selected
            </Button>
          </>
        )}
      </div>

      <Form form={form} component={false}>
        <AppTable
          isLoading={isLoading}
          components={{
            body: {
              cell: EditableCell,
            },
          }}
          bordered
          dataSource={data ?? []}
          columns={mergedColumns}
          rowClassName={styles.editableRow}
          rowKey="id"
        />
      </Form>
    </>
  );
}
