from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)


def create_tables():
    with app.app_context():
        db.create_all()


# 手动调用创建表的函数
create_tables()


# 登录路由
@app.route('/', methods=['GET', 'POST'])
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        user = User.query.filter_by(username=username).first()

        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            return redirect(url_for('index'))
        else:
            flash('用户名或密码错误', 'error')
            return redirect(url_for('login'))
    return render_template('login1.html')


# 注册路由
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = generate_password_hash(request.form['password'])

        if User.query.filter_by(username=username).first():
            flash('用户名已存在')
            return redirect(url_for('register'))

        new_user = User(username=username, password=password)
        db.session.add(new_user)
        db.session.commit()

        flash('注册成功，请登录！', 'success')
        return redirect(url_for('login'))

    return render_template('login1.html')


# 主页路由
@app.route('/index')
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('index.html')


# 退出登录
@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('login'))


# 密码重置路由
@app.route('/reset_password', methods=['GET', 'POST'])
def reset_password():

    username = request.form['username']
    user = User.query.filter_by(username=username).first()
    old_password = request.form['old_password']
    new_password = request.form['new_password']

    if check_password_hash(user.password, old_password):
        user.password = generate_password_hash(new_password)
        db.session.commit()
        flash('密码已重置！', 'success')
    elif not user:
        flash('用户不存在！', 'error')
    else:
        flash('旧密码不正确', 'error')

    return redirect(url_for('login'))


if __name__ == '__main__':
    app.run(debug=True)
