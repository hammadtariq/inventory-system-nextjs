import { useCallback, useEffect, useState } from "react";

import { Button, Form, Input, InputNumber } from "antd";
import { useRouter } from "next/router";

import SelectCompany from "@/components/selectCompany";
import SelectItemList from "@/components/selectItemList";
import { createItem, updateItem } from "@/hooks/items";
import permissionsUtil from "@/utils/permission.util";
import { VALIDATE_MESSAGE } from "@/utils/ui.util";

import AppBackButton from "./backButton";

const AddEditItem = ({ item }) => {
  const router = useRouter();
  const [companyId, setCompanyId] = useState(null);
  const [selectedListType, setSelectedListType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const canCreate = permissionsUtil.checkAuth({
    category: "item",
    action: "create",
  });

  const selectCompanyOnChange = useCallback((id) => setCompanyId(id), [companyId]);
  const selectItemListOnChange = useCallback((type) => setSelectedListType(type), [selectedListType]);

  useEffect(() => {
    if (item) {
      const { company, type, itemName, ratePerLbs = "", ratePerKgs = "", ratePerBale = "" } = item;
      const { id, companyName } = company;
      form.setFieldsValue({ companyName, companyId: id, type, itemName, ratePerLbs, ratePerKgs, ratePerBale });
      setCompanyId(id);
      setSelectedListType(type);
    }
  }, [item]);

  const onFinish = async (values) => {
    setLoading(true);
    const itemValues = { ...values };
    itemValues.type = selectedListType;
    itemValues.companyId = companyId;
    try {
      if (item) {
        await updateItem(item.id, itemValues);
      } else {
        await createItem(itemValues);
      }
      router.push("/items");
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" name="nest-messages" onFinish={onFinish} validateMessages={VALIDATE_MESSAGE}>
      <Form.Item
        label="Select Company"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <SelectCompany defaultValue={item && item.company.id} selectCompanyOnChange={selectCompanyOnChange} />
      </Form.Item>
      <Form.Item
        rules={[
          {
            required: true,
          },
        ]}
        label="Select List Type"
      >
        <SelectItemList defaultValue={item && item.type} selectItemListOnChange={selectItemListOnChange} />
      </Form.Item>
      <Form.Item
        name="itemName"
        label="Name"
        rules={[
          {
            required: true,
            type: "string",
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="ratePerLbs"
        label="Rate per LBS (Rs)"
        rules={[
          {
            type: "number",
          },
        ]}
      >
        <InputNumber />
      </Form.Item>
      <Form.Item
        name="ratePerKgs"
        label="Rate per KGS (Rs)"
        rules={[
          {
            type: "number",
          },
        ]}
      >
        <InputNumber />
      </Form.Item>
      {selectedListType == "SMALL_BALES" && (
        <Form.Item
          name="ratePerBale"
          label="Rate per Bale (Rs)"
          rules={[
            {
              type: "number",
            },
          ]}
        >
          <InputNumber />
        </Form.Item>
      )}
      <Form.Item className="action-btn">
        <AppBackButton />
        <Button type="primary" htmlType="submit" loading={loading} disabled={!canCreate}>
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default AddEditItem;
