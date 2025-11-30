import FeeEditor from '../../../../../components/FeeEditor'

export default function AccountantFeeEdit({ params }: { params: { id: string } }) {
  return <FeeEditor appId={params.id} role="accountant" />
}
