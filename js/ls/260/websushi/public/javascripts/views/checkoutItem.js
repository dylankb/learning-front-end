var CheckoutItemView = Backbone.View.extend({
  attributes: function() {
    return {
      'data-id': this.model.attributes.id,
    };
  },
  decrementQuantity: function() {
    var collection = this.model.collection;
    collection.removeItem(this.model);
    collection.trigger('UPDATE_CHECKOUT_TOTAL');
  },
  events: {
    'click .fa-plus': 'incrementQuantity',
    'click .fa-minus': 'decrementQuantity',
  },
  incrementQuantity: function() {
    this.model.collection.addItem(this.model);
    this.model.collection.trigger('UPDATE_CHECKOUT_TOTAL');
  },
  initialize: function() {
    this.render();
    this.listenTo(this.model, 'change:quantity', this.render);
    this.listenTo(this.model, 'remove', this.remove);
    this.listenTo(this.collection, 'add', this.renderCheckoutItem);
  },
  render: function() {
    this.$el.html(this.template(this.model.toJSON()));
  },
  tagName: 'tr',
  template: Handlebars.templates.checkoutItem,
});
