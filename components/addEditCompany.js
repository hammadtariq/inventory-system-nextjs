import { useEffect, useState } from "react";

import { Button, Form, Input } from "antd";
import { useRouter } from "next/router";

import { createCompany, updateCompany } from "@/hooks/company";
import permissionsUtil from "@/utils/permission.util";
import { toLowerCaseObjVal, VALIDATE_MESSAGE } from "@/utils/ui.util";

import AppBackButton from "./backButton";

const canCreate = permissionsUtil.checkAuth({
  category: "company",
  action: "create",
});

const canEdit = permissionsUtil.checkAuth({
  category: "company",
  action: "edit",
});

const AddEditCompany = ({ company }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (company) {
      const { companyName, email = "", phone = "", address = "" } = company;
      form.setFieldsValue({ companyName, email, phone, address });
    }
  }, [company, form]);

  const onFinish = async (values) => {
    setLoading(true);
    values = toLowerCaseObjVal(values);
    try {
      if (company) {
        await updateCompany(company.id, values);
      } else {
        await createCompany(values);
      }
      router.push("/company");
    } catch (error) {
      console.error("Error: ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" name="nest-messages" onFinish={onFinish} validateMessages={VALIDATE_MESSAGE}>
      <Form.Item
        name="companyName"
        label="Name"
        rules={[
          {
            required: true,
            type: "string",
            min: 3,
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="email"
        label="Email"
        rules={[
          {
            type: "email",
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="phone"
        label="Phone"
        rules={[
          {
            type: "string",
            max: 24,
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="address"
        label="Address"
        rules={[
          {
            min: 10,
          },
        ]}
      >
        <Input.TextArea />
      </Form.Item>
      <Form.Item className="action-btn">
        <AppBackButton />
        <Button type="primary" htmlType="submit" loading={loading} disabled={!canCreate || !canEdit}>
          {company ? "Update" : "Create"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default AddEditCompany;
