import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button, Form, Input } from "antd";

import { createCustomer, updateCustomer } from "../hooks/customers";
import { VALIDATE_MESSAGE, LAYOUT } from "@/utils/ui";
import permissionsUtil from "@/utils/permission.util";

const canCreate = permissionsUtil.checkAuth({
  category: "customer",
  action: "create",
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
  }, [customer]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      if (customer) {
        await updateCustomer(customer.id, values);
      } else {
        await createCustomer({ ...values });
      }
      router.push("/customers");
    } catch (error) {
      setLoading(false);
    }
  };
  return (
    <Form form={form} {...LAYOUT} name="nest-messages" onFinish={onFinish} validateMessages={VALIDATE_MESSAGE}>
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
      <Form.Item wrapperCol={{ ...LAYOUT.wrapperCol, offset: 2 }}>
        <Button type="primary" htmlType="submit" loading={loading} disabled={!canCreate}>
          {customer ? "Update" : "Create"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default AddEditCustomer;
