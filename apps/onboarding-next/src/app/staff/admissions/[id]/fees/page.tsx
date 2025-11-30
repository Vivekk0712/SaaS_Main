import FeeEditor from '../../../../../components/FeeEditor'

export default function AdmissionsFeeEdit({ params }: { params: { id: string } }) {
  return <FeeEditor appId={params.id} role="admissions" />
}

