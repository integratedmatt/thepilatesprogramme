import type { StructureResolver } from 'sanity/structure';

export const structure: StructureResolver = (S) =>
  S.list().title('Content').items([
    S.listItem().title('Site settings').child(S.document().schemaType('siteSettings').documentId('siteSettings')),
    S.divider(),
    S.listItem().title('Courses').child(S.documentTypeList('course').title('Courses')),
    S.listItem().title('CPD').child(S.documentTypeList('cpd').title('CPD')),
    S.listItem().title('Course dates').child(S.documentTypeList('courseDate').title('Course dates').defaultOrdering([{ field: 'startDate', direction: 'asc' }])),
    S.listItem().title('Pricing rules').child(S.documentTypeList('pricingRule')),
    S.divider(),
    S.listItem().title('Jobs').child(
      S.list().title('Jobs').items([
        S.listItem().title('Pending jobs').child(S.documentList().title('Pending jobs').filter('_type == "job" && status == "pending"').apiVersion('2026-10-01')),
        S.listItem().title('Approved').child(S.documentList().title('Approved').filter('_type == "job" && status == "approved"').apiVersion('2026-10-01')),
        S.listItem().title('Expired').child(S.documentList().title('Expired').filter('_type == "job" && status == "expired"').apiVersion('2026-10-01')),
        S.listItem().title('Rejected').child(S.documentList().title('Rejected').filter('_type == "job" && status == "rejected"').apiVersion('2026-10-01')),
        S.listItem().title('Studios').child(S.documentTypeList('studio')),
      ]),
    ),
    S.listItem().title('Graduates').child(
      S.list().title('Graduates').items([
        S.listItem().title('Pending').child(S.documentList().title('Pending graduates').filter('_type == "graduate" && status == "pending"').apiVersion('2026-10-01')),
        S.listItem().title('Approved').child(S.documentList().title('Approved graduates').filter('_type == "graduate" && status == "approved"').apiVersion('2026-10-01')),
      ]),
    ),
    S.listItem().title('Testimonials').child(S.documentTypeList('testimonial')),
    S.listItem().title('Applications').child(S.documentList().title('Pending applications').filter('_type == "application" && status == "pending"').apiVersion('2026-10-01')),
    S.divider(),
    S.listItem().title('Journal').child(S.list().title('Journal').items([
      S.listItem().title('Posts').child(S.documentTypeList('post')),
      S.listItem().title('Categories').child(S.documentTypeList('category')),
      S.listItem().title('Authors').child(S.documentTypeList('author')),
    ])),
    S.listItem().title('FAQs').child(S.documentTypeList('faq').defaultOrdering([{ field: 'order', direction: 'asc' }])),
    S.listItem().title('Team').child(S.documentTypeList('teamMember')),
    S.listItem().title('Redirects').child(S.documentTypeList('redirect')),
  ]);
