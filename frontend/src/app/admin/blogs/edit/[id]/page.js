import BlogEditor from "@/views/admin/BlogEditor";

export default async function AdminBlogEditPage({ params }) {
  const { id } = await params;
  return <BlogEditor isEdit={true} id={id} />;
}
