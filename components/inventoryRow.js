import { Descriptions, Input, Card, Divider } from "antd";

export default function InventoryRow({ itemName }) {
  return (
    <div>
      <Card>
        <Descriptions bordered={true} column={6} layout="vertical" title={itemName}>
          <Descriptions.Item label="No Of Bales">
            <Input size="small" type="number" required />
          </Descriptions.Item>
          <Descriptions.Item label="Bale Weight LBS">
            <Input size="small" type="number" />
          </Descriptions.Item>
          <Descriptions.Item label="Bale Weight KGS">
            <Input size="small" type="number" />
          </Descriptions.Item>
          <Descriptions.Item label="Rate Per LBS">
            <Input size="small" type="number" />
          </Descriptions.Item>
          <Descriptions.Item label="Rate Per KGS">
            <Input size="small" type="number" />
          </Descriptions.Item>
          <Descriptions.Item label="Rate Per Bale">
            <Input size="small" type="number" required />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Divider />
    </div>
  );
}
