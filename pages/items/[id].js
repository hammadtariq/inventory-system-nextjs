import { Spin, Alert } from "antd";

import AddEditItem from "@/components/addEditItem";
import AppTitle from "@/components/title";
import { useItem } from "@/hooks/items";

function Update({ id }) {
  const { item, error, isLoading } = useItem(id);
  if (error) return <Alert message={error} type="error" />;
  return (
    <div>
      <AppTitle level={2}>Update Item</AppTitle>
      {isLoading ? <Spin size="large" /> : <AddEditItem item={item} />}
    </div>
  );
}

export default Update;

export async function getServerSideProps({ params }) {
  return {
    props: { id: params.id },
  };
}
