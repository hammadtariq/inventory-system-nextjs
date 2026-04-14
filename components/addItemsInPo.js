import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Alert, Button, Checkbox, Form, Popconfirm, Select, Typography } from "antd";

import EditableCell from "@/components/editableCell";
import AppTable from "@/components/table";
import { useItemsByCompanyIdAndType } from "@/hooks/items";
import styles from "@/styles/EditableCell.module.css";

export default function AddItemsInPo({
  companyId,
  type,
  setData,
  editAll,
  setEditAll,
  data,
  isEdit,
  viewOnly = false,
  removedItems = [],
  setRemovedItems = () => {},
}) {
  const [editingKey, setEditingKey] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [selectedToRestore, setSelectedToRestore] = useState([]);
  const [form] = Form.useForm();
  const { items, isLoading, error } = useItemsByCompanyIdAndType(companyId, type, isEdit);

  useEffect(() => {
    if (!isEdit) {
      setData(items);
    }
  }, [isEdit, items, setData]);

  const isEditing = useCallback((record) => editingKey.includes(record.key), [editingKey]);

  const edit = useCallback(
    (record) => {
      form.setFieldsValue({
        itemName: "",
        noOfBales: 0,
        baleWeightLbs: 0,
        baleWeightKgs: 0,
        ratePerLbs: 0,
        ratePerKgs: 0,
        ...(type === "SMALL_BALES" && { ratePerBale: 0 }),
        ...record,
      });
    },
    [form, type]
  );

  useEffect(() => {
    if (editAll) {
      data?.forEach((record) => {
        edit(record);
        setEditingKey((prev) => [...prev, record.key]);
      });
    }
  }, [data, edit, editAll]);

  const cancel = useCallback(() => {
    setEditingKey([]);
    setEditAll(false);
  }, [setEditAll]);

  const remove = useCallback(
    (record) => {
      const index = data.findIndex((item) => record.id === item.id);
      const newData = [...data];
      newData.splice(index, 1);
      setData(newData);
      setSelectedRowKeys((prev) => prev.filter((key) => key !== record.id));
      setRemovedItems((prev) => [...prev, record]);
    },
    [data, setData, setRemovedItems]
  );

  const removeSelected = useCallback(() => {
    const removedRecords = data.filter((item) => selectedRowKeys.includes(item.id));
    const newData = data.filter((item) => !selectedRowKeys.includes(item.id));
    setData(newData);
    setSelectedRowKeys([]);
    setSelectAllChecked(false);
    setRemovedItems((prev) => [...prev, ...removedRecords]);
  }, [data, selectedRowKeys, setData, setRemovedItems]);

  const applyRestored = useCallback(() => {
    const itemsToRestore = removedItems.filter((item) => selectedToRestore.includes(item.id));
    const merged = [...data, ...itemsToRestore];
    merged.sort((a, b) => a.itemName.localeCompare(b.itemName));
    setData(merged);
    setRemovedItems((prev) => prev.filter((item) => !selectedToRestore.includes(item.id)));
    setSelectedToRestore([]);
  }, [data, removedItems, selectedToRestore, setData, setRemovedItems]);

  const save = useCallback(
    async (key, row) => {
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
    },
    [data]
  );

  const saveAll = useCallback(async () => {
    try {
      const allValues = form.getFieldsValue();

      // Identify only items where the user entered data
      const filledItemIds = new Set(
        Object.keys(allValues).filter((id) => {
          const item = allValues[id];
          return item?.noOfBales || item?.baleWeightLbs || item?.baleWeightKgs;
        })
      );

      if (!filledItemIds.size) {
        setRemovedItems((prev) => [...prev, ...data]);
        setData([]);
        setEditAll(false);
        setEditingKey([]);
        return;
      }

      // Validate only the fields belonging to filled items
      const fieldsToValidate = [...filledItemIds].flatMap((id) =>
        Object.keys(allValues[id]).map((dataIndex) => [Number(id), dataIndex])
      );

      const row = await form.validateFields(fieldsToValidate);

      for (const key in row) {
        if (Object.hasOwnProperty.call(row, key)) {
          save(Number(key), row[key]);
        }
      }

      const filledData = data.filter((item) => filledItemIds.has(String(item.id)));
      const emptyData = data.filter((item) => !filledItemIds.has(String(item.id)));
      setRemovedItems((prev) => [...prev, ...emptyData]);
      setData(filledData);
      setEditAll(false);
      setEditingKey([]);
    } catch (error) {
      console.log("Validate Failed:", error);
    }
  }, [form, data, save, setData, setEditAll, setRemovedItems]);

  const handleSelectAll = useCallback(
    (e) => {
      setSelectAllChecked(e.target.checked);
      setSelectedRowKeys(e.target.checked ? data.map((item) => item.id) : []);
    },
    [data]
  );

  const handleRowSelect = useCallback(
    (selected, record) => {
      setSelectedRowKeys((prev) => {
        const updated = selected ? [...prev, record.id] : prev.filter((key) => key !== record.id);
        setSelectAllChecked(updated.length === data.length);
        return updated;
      });
    },
    [data?.length]
  );

  const selectAllColumn = useMemo(
    () => ({
      title: <Checkbox checked={selectAllChecked} onChange={handleSelectAll} disabled={data?.length === 0} />,
      dataIndex: "operation",
      width: "4%",
      render: (_, record) => (
        <div className={styles.centerAlign}>
          <Checkbox
            checked={selectedRowKeys.includes(record.id)}
            onChange={(e) => handleRowSelect(e.target.checked, record)}
          />
        </div>
      ),
    }),
    [selectAllChecked, handleSelectAll, data?.length, selectedRowKeys, handleRowSelect]
  );

  const operationColumn = useMemo(
    () => ({
      title: "operation",
      dataIndex: "operation",
      width: "8%",
      render: (_, record) => {
        isEditing(record);
        return <Typography.Link onClick={() => remove(record)}>Remove</Typography.Link>;
      },
    }),
    [isEditing, remove]
  );

  const baseColumns = useMemo(() => {
    const cols = [
      { title: "Item Name", dataIndex: "itemName", width: "18%", editable: false },
      { title: "No of Bales", dataIndex: "noOfBales", width: "12%", editable: true, required: true },
      { title: "Bale Weight (LBS)", dataIndex: "baleWeightLbs", width: "12%", editable: true, required: false },
      { title: "Bale Weight (KGS)", dataIndex: "baleWeightKgs", width: "12%", editable: true, required: false },
      { title: "Rate per (LBS)", dataIndex: "ratePerLbs", width: "12%", editable: true, required: false },
      { title: "Rate Per (KGS)", dataIndex: "ratePerKgs", width: "12%", editable: true, required: false },
    ];
    if (type === "SMALL_BALES") {
      cols.push({ title: "Rate Per Bale", dataIndex: "ratePerBale", width: "10%", editable: true, required: true });
    }
    return cols;
  }, [type]);

  const mergedColumns = useMemo(() => {
    const cols = baseColumns.map((col) => {
      if (!col.editable) return col;
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

    if (!viewOnly) {
      cols.unshift(selectAllColumn);
      cols.push(operationColumn);
    }

    return cols;
  }, [baseColumns, form, isEditing, viewOnly, selectAllColumn, operationColumn]);

  const removedItemOptions = useMemo(
    () => removedItems.map((item) => ({ label: item.itemName, value: item.id })),
    [removedItems]
  );

  if (error) return <Alert type="error">{error?.message || String(error)}</Alert>;

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
            <Select
              mode="multiple"
              placeholder="Add Removed Items"
              value={selectedToRestore}
              onChange={setSelectedToRestore}
              options={removedItemOptions}
              disabled={removedItems.length === 0}
              style={{ width: 220, marginLeft: 10, marginRight: 10 }}
              maxTagCount={0}
              maxTagPlaceholder={(omitted) => `${omitted.length} item${omitted.length > 1 ? "s" : ""} selected`}
            />
            <Button onClick={applyRestored} disabled={selectedToRestore.length === 0}>
              Apply
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
          scroll={{ x: "100%" }}
        />
      </Form>
    </>
  );
}
