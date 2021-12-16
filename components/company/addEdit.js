import { useState } from "react";
import { useRouter } from "next/router";
import { Button, Form, Input } from "antd";

import { createCompany, updateCompany } from "../../hooks/company";

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

const AddEdit = ({ company }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const onFinish = async (values) => {
    setLoading(true);
    if (company) {
      await updateCompany(company.id, values);
      router.push("/company");
    } else {
      await createCompany(values);
      router.push("/company");
    }
  };
  return (
    <Form {...layout} name="nest-messages" onFinish={onFinish} validateMessages={validateMessages}>
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
        initialValue={company ? company.companyName : null}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="email"
        label="Email"
        initialValue={company ? company.email : null}
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
        initialValue={company ? company.phone : null}
        rules={[
          {
            type: "string",
            max: 24,
            required: true,
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="address"
        initialValue={company ? company.address : null}
        label="Address"
        rules={[
          {
            required: true,
            min: 10,
          },
        ]}
      >
        <Input.TextArea />
      </Form.Item>
      <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 2 }}>
        <Button type="primary" htmlType="submit" loading={loading}>
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default AddEdit;
