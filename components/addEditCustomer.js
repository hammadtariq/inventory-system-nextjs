import { useEffect, useState } from "react";

import { Button, Form, Input } from "antd";
import { useRouter } from "next/router";

import permissionsUtil from "@/utils/permission.util";
import { toLowerCaseObjVal, VALIDATE_MESSAGE } from "@/utils/ui.util";

import { createCustomer, updateCustomer } from "../hooks/customers";
import AppBackButton from "./backButton";

const canCreate = permissionsUtil.checkAuth({
  category: "customer",
  action: "create",
});

const canEdit = permissionsUtil.checkAuth({
  category: "customer",
  action: "edit",
});

const AddEditCustomer = ({ customer }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    if (customer) {
      const { firstName, lastName, email, phone, address } = customer;
      form.setFieldsValue({
        firstName,
        lastName,
        email,
        phone,
        address,
      });
    }
  }, [customer, form]);

  const onFinish = async (values) => {
    setLoading(true);
    values = toLowerCaseObjVal(values);
    try {
      if (customer) {
        await updateCustomer(customer.id, values);
      } else {
        await createCustomer({ ...values });
      }
      router.push("/customers");
    } catch (error) {
      console.error("Error: ", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Form form={form} layout="vertical" name="nest-messages" onFinish={onFinish} validateMessages={VALIDATE_MESSAGE}>
      <Form.Item
        name="firstName"
        label="First Name"
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
        name="lastName"
        label="Last Name"
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
            required: true,
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
          {customer ? "Update" : "Create"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default AddEditCustomer;
