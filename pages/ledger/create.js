import { useState } from "react";
import { useRouter } from "next/router";
import { Button, Form, Input } from "antd";
import { VALIDATE_MESSAGE, LAYOUT } from "@/utils/ui.util";
import permissionsUtil from "@/utils/permission.util";
import { createTransaction } from "../../hooks/ledger";

const canCreate = permissionsUtil.checkAuth({
  category: "transaction",
  action: "create",
});

const CreateTransaction = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { companyId, totalAmount } = values;
      await createTransaction({ totalAmount, companyId, spendType: "DEBIT" });
      router.push("/ledger");
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Create Transaction</h2>
      <Form {...LAYOUT} name="nest-messages" onFinish={onFinish} validateMessages={VALIDATE_MESSAGE}>
        <Form.Item
          name="companyId"
          label="Company"
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
          name="totalAmount"
          label="Amount"
          rules={[
            {
              required: true,
              type: "string",
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item wrapperCol={{ ...LAYOUT.wrapperCol, offset: 2 }}>
          <Button type="primary" htmlType="submit" loading={loading} disabled={!canCreate}>
            Create
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
export default CreateTransaction;
