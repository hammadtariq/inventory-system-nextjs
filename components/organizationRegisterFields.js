import { Form, Input } from "antd";

import styles from "./organizationRegisterFields.module.css";

const OrganizationRegisterFields = () => {
  return (
    <div className={styles.registerGrid}>
      <Form.Item
        name="organizationName"
        label="Organization"
        rules={[{ required: true, min: 3, message: "Enter your organization name" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item name="slug" label="Slug" rules={[{ min: 3, message: "Slug must be at least 3 characters" }]}>
        <Input />
      </Form.Item>

      <Form.Item name="firstName" label="First name" rules={[{ required: true, min: 3 }]}>
        <Input />
      </Form.Item>

      <Form.Item name="lastName" label="Last name" rules={[{ required: true, min: 3 }]}>
        <Input />
      </Form.Item>

      <Form.Item
        name="email"
        label="Email"
        rules={[{ type: "email", required: true, message: "Please enter a valid email address" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
        <Input.Password />
      </Form.Item>
    </div>
  );
};

export default OrganizationRegisterFields;
