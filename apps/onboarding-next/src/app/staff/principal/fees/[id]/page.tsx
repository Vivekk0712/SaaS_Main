import FeeEditor from '../../../../../components/FeeEditor'

export default function PrincipalFeeEdit({ params }: { params: { id: string } }) {
  return <FeeEditor appId={params.id} role="principal" />
}

