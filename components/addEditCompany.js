import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button, Form, Input } from "antd";

import { createCompany, updateCompany } from "@/hooks/company";
import { validateMessages, layout } from "@/utils/ui";
import permissionsUtil from "@/utils/permission.util";

const canCreate = permissionsUtil.checkAuth({
  category: "company",
  action: "create",
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
  }, [company]);

  const onFinish = async (values) => {
    setLoading(true);

    try {
      if (company) {
        await updateCompany(company.id, values);
      } else {
        await createCompany(values);
      }
      router.push("/company");
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <Form form={form} {...layout} name="nest-messages" onFinish={onFinish} validateMessages={validateMessages}>
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
      <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 2 }}>
        <Button type="primary" htmlType="submit" loading={loading} disabled={!canCreate}>
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default AddEditCompany;
