import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button, Form, Input } from "antd";

import { createCustomer, updateCustomer } from "../../hooks/customers";
import { validateMessages, layout } from "@/utils/ui";

const CustomerForm = ({ customer }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    if (customer) {
      const { firstName, lastName, email } = customer;
      form.setFieldsValue({
        firstName,
        lastName,
        email,
      });
    }
  }, [customer]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      if (customer) {
        await updateCustomer(customer.id, values);
      } else {
        await createCustomer({ ...values, role: "customer" });
      }
      router.push("/customers");
    } catch (error) {
      setLoading(false);
    }
  };
  return (
    <Form {...layout} name="nest-messages" onFinish={onFinish} validateMessages={validateMessages}>
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
      <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 2 }}>
        <Button type="primary" htmlType="submit" loading={loading}>
          {customer ? "Update" : "Create"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default CustomerForm;
