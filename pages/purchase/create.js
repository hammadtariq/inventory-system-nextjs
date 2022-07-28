import AddEditPurchase from "@/components/addEditPurchase";
import AppTitle from "@/components/title";

const CreatePurchase = () => {
  return (
    <div>
      <AppTitle level={2}>Create Purchase Order</AppTitle>
      <AddEditPurchase />
    </div>
  );
};
export default CreatePurchase;
