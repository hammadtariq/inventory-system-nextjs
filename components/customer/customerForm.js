import { useState } from "react";
import { useRouter } from "next/router";
import { Button, Form, Input } from "antd";

import { createCustomer, updateCustomer } from "../../hooks/customers";

const layout = {
  labelCol: {
    span: 2,
  },
  wrapperCol: {
    span: 12,
  },
};

const validateMessages = {
  required: "${label} is required!",
  types: {
    email: "${label} is not a valid email!",
    number: "${label} is not a valid number!",
  },
  number: {
    range: "${label} must be between ${min} and ${max}",
  },
};

const CustomerForm = ({ customer }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const onFinish = async (values) => {
    setLoading(true);
    if (customer) {
      await updateCustomer(customer.id, values);
      router.push("/customers");
    } else {
      await createCustomer({ ...values, role: "customer" });
      router.push("/customers");
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
        initialValue={customer ? customer.firstName : null}
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
        initialValue={customer ? customer.lastName : null}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="email"
        label="Email"
        initialValue={customer ? customer.email : null}
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
