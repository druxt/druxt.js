export default (context, inject) => {
  const options = <%= JSON.stringify(options.breadcrumb) %>

  inject('druxtBreadcrumb', { options })
}
