--
-- PostgreSQL database dump
--

\restrict EW9tG7SJizV6ry9w2olC3hATHmCfzasXK89oqzlgb8QHBKxrULkt4r9GMeLlZ28

-- Dumped from database version 16.11 (74c6bb6)
-- Dumped by pg_dump version 16.11 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: _system; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

CREATE SCHEMA _system;


ALTER SCHEMA _system OWNER TO neondb_owner;

--
-- Name: audit_action; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.audit_action AS ENUM (
    'user_created',
    'user_updated',
    'user_deleted',
    'user_banned',
    'user_unbanned',
    'user_restricted',
    'profile_edited',
    'status_changed',
    'sql_query_executed',
    'group_deleted',
    'create_partner',
    'update_partner',
    'delete_partner'
);


ALTER TYPE public.audit_action OWNER TO neondb_owner;

--
-- Name: currency; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.currency AS ENUM (
    'NGN',
    'GBP',
    'EUR',
    'USD',
    'CAD'
);


ALTER TYPE public.currency OWNER TO neondb_owner;

--
-- Name: device_platform; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.device_platform AS ENUM (
    'ios',
    'android',
    'web'
);


ALTER TYPE public.device_platform OWNER TO neondb_owner;

--
-- Name: export_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.export_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);


ALTER TYPE public.export_status OWNER TO neondb_owner;

--
-- Name: export_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.export_type AS ENUM (
    'contributions',
    'groups',
    'all'
);


ALTER TYPE public.export_type OWNER TO neondb_owner;

--
-- Name: gender; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.gender AS ENUM (
    'male',
    'female',
    'prefer_not_to_say'
);


ALTER TYPE public.gender OWNER TO neondb_owner;

--
-- Name: group_frequency; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.group_frequency AS ENUM (
    'weekly',
    'monthly'
);


ALTER TYPE public.group_frequency OWNER TO neondb_owner;

--
-- Name: group_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.group_status AS ENUM (
    'pending',
    'active',
    'completed'
);


ALTER TYPE public.group_status OWNER TO neondb_owner;

--
-- Name: group_visibility; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.group_visibility AS ENUM (
    'open',
    'closed'
);


ALTER TYPE public.group_visibility OWNER TO neondb_owner;

--
-- Name: join_request_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.join_request_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public.join_request_status OWNER TO neondb_owner;

--
-- Name: member_role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.member_role AS ENUM (
    'creator',
    'participant'
);


ALTER TYPE public.member_role OWNER TO neondb_owner;

--
-- Name: member_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.member_status AS ENUM (
    'active',
    'inactive'
);


ALTER TYPE public.member_status OWNER TO neondb_owner;

--
-- Name: message_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.message_type AS ENUM (
    'direct',
    'group',
    'inbox'
);


ALTER TYPE public.message_type OWNER TO neondb_owner;

--
-- Name: notification_channel; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.notification_channel AS ENUM (
    'push',
    'email',
    'in_app'
);


ALTER TYPE public.notification_channel OWNER TO neondb_owner;

--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.notification_type AS ENUM (
    'contribution_reminder',
    'contribution_received',
    'payout_upcoming',
    'payout_received',
    'group_invitation',
    'group_joined',
    'cycle_advanced',
    'message_received',
    'system_announcement'
);


ALTER TYPE public.notification_type OWNER TO neondb_owner;

--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.payment_status AS ENUM (
    'paid',
    'pending',
    'overdue'
);


ALTER TYPE public.payment_status OWNER TO neondb_owner;

--
-- Name: payout_medium; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.payout_medium AS ENUM (
    'admin',
    'cycle_receiver'
);


ALTER TYPE public.payout_medium OWNER TO neondb_owner;

--
-- Name: pot_transaction_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.pot_transaction_type AS ENUM (
    'deposit',
    'withdrawal'
);


ALTER TYPE public.pot_transaction_type OWNER TO neondb_owner;

--
-- Name: user_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.user_status AS ENUM (
    'active',
    'restricted',
    'banned',
    'deleted'
);


ALTER TYPE public.user_status OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: replit_database_migrations_v1; Type: TABLE; Schema: _system; Owner: neondb_owner
--

CREATE TABLE _system.replit_database_migrations_v1 (
    id bigint NOT NULL,
    build_id text NOT NULL,
    deployment_id text NOT NULL,
    statement_count bigint NOT NULL,
    applied_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE _system.replit_database_migrations_v1 OWNER TO neondb_owner;

--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE; Schema: _system; Owner: neondb_owner
--

CREATE SEQUENCE _system.replit_database_migrations_v1_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE _system.replit_database_migrations_v1_id_seq OWNER TO neondb_owner;

--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE OWNED BY; Schema: _system; Owner: neondb_owner
--

ALTER SEQUENCE _system.replit_database_migrations_v1_id_seq OWNED BY _system.replit_database_migrations_v1.id;


--
-- Name: audit_events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.audit_events (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    actor_id character varying NOT NULL,
    target_user_id character varying,
    action public.audit_action NOT NULL,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_events OWNER TO neondb_owner;

--
-- Name: contributions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.contributions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    group_id character varying NOT NULL,
    member_id character varying NOT NULL,
    cycle integer NOT NULL,
    amount integer NOT NULL,
    status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
    date_paid text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    receipt_url text
);


ALTER TABLE public.contributions OWNER TO neondb_owner;

--
-- Name: data_exports; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.data_exports (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    export_type public.export_type NOT NULL,
    status public.export_status DEFAULT 'pending'::public.export_status NOT NULL,
    file_url text,
    file_name character varying(255),
    file_size integer,
    expires_at timestamp without time zone,
    error_message text,
    requested_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone
);


ALTER TABLE public.data_exports OWNER TO neondb_owner;

--
-- Name: device_tokens; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.device_tokens (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    token text NOT NULL,
    platform public.device_platform NOT NULL,
    device_name character varying(200),
    is_active integer DEFAULT 1 NOT NULL,
    last_used timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.device_tokens OWNER TO neondb_owner;

--
-- Name: groups; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.groups (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    contribution_amount integer NOT NULL,
    frequency public.group_frequency NOT NULL,
    status public.group_status DEFAULT 'pending'::public.group_status NOT NULL,
    current_cycle integer DEFAULT 1 NOT NULL,
    total_cycles integer NOT NULL,
    next_collection_date text NOT NULL,
    start_date text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    currency public.currency DEFAULT 'NGN'::public.currency NOT NULL,
    user_id character varying NOT NULL,
    visibility public.group_visibility DEFAULT 'closed'::public.group_visibility NOT NULL,
    max_members integer,
    go_live_date timestamp without time zone NOT NULL,
    is_live integer DEFAULT 0 NOT NULL,
    completed_at timestamp without time zone,
    adjusted_go_live_date timestamp without time zone,
    payout_medium public.payout_medium DEFAULT 'cycle_receiver'::public.payout_medium NOT NULL,
    schedule_visibility integer DEFAULT 1 NOT NULL,
    recipient_visibility integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.groups OWNER TO neondb_owner;

--
-- Name: invite_links; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.invite_links (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    group_id character varying NOT NULL,
    token character varying NOT NULL,
    created_by character varying NOT NULL,
    expires_at timestamp without time zone,
    max_uses integer,
    used_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.invite_links OWNER TO neondb_owner;

--
-- Name: join_requests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.join_requests (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    group_id character varying NOT NULL,
    user_id character varying NOT NULL,
    status public.join_request_status DEFAULT 'pending'::public.join_request_status NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.join_requests OWNER TO neondb_owner;

--
-- Name: members; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.members (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    group_id character varying NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    avatar text,
    join_date text NOT NULL,
    status public.member_status DEFAULT 'active'::public.member_status NOT NULL,
    rotation_order integer NOT NULL,
    user_id character varying,
    role public.member_role DEFAULT 'participant'::public.member_role NOT NULL,
    can_post_in_group integer DEFAULT 1 NOT NULL,
    is_admin integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.members OWNER TO neondb_owner;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.messages (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    group_id character varying,
    sender_id character varying NOT NULL,
    recipient_id character varying,
    type public.message_type NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.messages OWNER TO neondb_owner;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    type public.notification_type NOT NULL,
    channel public.notification_channel NOT NULL,
    title character varying(255) NOT NULL,
    body text NOT NULL,
    metadata jsonb,
    is_read integer DEFAULT 0 NOT NULL,
    sent_at timestamp without time zone DEFAULT now() NOT NULL,
    read_at timestamp without time zone
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: partner_clicks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.partner_clicks (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    partner_id character varying NOT NULL,
    user_id character varying,
    clicked_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.partner_clicks OWNER TO neondb_owner;

--
-- Name: partners; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.partners (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying(200) NOT NULL,
    description text NOT NULL,
    category character varying(100) NOT NULL,
    affiliate_link text NOT NULL,
    commission_rate character varying(100),
    logo_url text,
    color character varying(50) DEFAULT 'from-blue-500 to-cyan-500'::character varying NOT NULL,
    is_active integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.partners OWNER TO neondb_owner;

--
-- Name: payment_receipts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.payment_receipts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    group_id character varying NOT NULL,
    member_id character varying NOT NULL,
    uploaded_by character varying NOT NULL,
    cycle_number integer NOT NULL,
    receipt_url text NOT NULL,
    file_size integer NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payment_receipts OWNER TO neondb_owner;

--
-- Name: pot_transactions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pot_transactions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    pot_id character varying NOT NULL,
    user_id character varying NOT NULL,
    amount numeric(15,2) NOT NULL,
    currency public.currency NOT NULL,
    type public.pot_transaction_type NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pot_transactions OWNER TO neondb_owner;

--
-- Name: savings_pots; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.savings_pots (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    name character varying(100) NOT NULL,
    balance_ngn numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    balance_gbp numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    balance_usd numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    balance_eur numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.savings_pots OWNER TO neondb_owner;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    theme character varying(20) DEFAULT 'light'::character varying NOT NULL,
    inactivity_timeout_enabled integer DEFAULT 1 NOT NULL,
    inactivity_timeout_minutes integer DEFAULT 3 NOT NULL,
    biometric_enabled integer DEFAULT 0 NOT NULL,
    push_notifications_enabled integer DEFAULT 1 NOT NULL,
    email_notifications_enabled integer DEFAULT 1 NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_settings OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying NOT NULL,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    phone character varying,
    about_me text,
    local_bank_account_name character varying,
    local_bank_account_number character varying,
    local_bank_name character varying,
    international_bank_account_name character varying,
    international_bank_account_number character varying,
    international_bank_swift_code character varying,
    international_bank_iban character varying,
    preferred_name character varying,
    local_bank_sort_code character varying,
    is_admin integer DEFAULT 0 NOT NULL,
    status public.user_status DEFAULT 'active'::public.user_status NOT NULL,
    deleted_at timestamp without time zone,
    restricted_until timestamp without time zone,
    avatar_choice character varying,
    gender public.gender,
    deletion_count integer DEFAULT 0 NOT NULL,
    password_hash character varying,
    auth_provider character varying,
    auth_provider_id character varying,
    password_reset_token character varying,
    password_reset_expires timestamp without time zone,
    total_funds_ngn numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    total_funds_gbp numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    total_funds_usd numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    total_funds_eur numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    clerk_user_id character varying
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: replit_database_migrations_v1 id; Type: DEFAULT; Schema: _system; Owner: neondb_owner
--

ALTER TABLE ONLY _system.replit_database_migrations_v1 ALTER COLUMN id SET DEFAULT nextval('_system.replit_database_migrations_v1_id_seq'::regclass);


--
-- Data for Name: replit_database_migrations_v1; Type: TABLE DATA; Schema: _system; Owner: neondb_owner
--

COPY _system.replit_database_migrations_v1 (id, build_id, deployment_id, statement_count, applied_at) FROM stdin;
1	7ff0dad4-de7b-4104-9a95-5d43ddc67674	dd6041b4-a7b9-43ef-bb30-bcaa4a37411d	34	2025-11-18 02:11:34.718963+00
2	1dccc662-8590-47ab-9e62-898df8b0e12f	dd6041b4-a7b9-43ef-bb30-bcaa4a37411d	3	2025-11-18 13:51:22.379764+00
3	580b0723-4488-44e5-abce-3fc304a8dab1	dd6041b4-a7b9-43ef-bb30-bcaa4a37411d	19	2025-11-19 21:16:49.647665+00
4	7e85c2b2-ec68-47c3-b187-f71954bc603d	dd6041b4-a7b9-43ef-bb30-bcaa4a37411d	3	2025-11-20 08:33:05.349543+00
5	d82f55b5-ab8d-4264-b700-0711aa612daa	dd6041b4-a7b9-43ef-bb30-bcaa4a37411d	1	2025-11-20 15:44:31.386313+00
6	6bcbf000-553a-4a0a-bc21-e65694738e8d	dd6041b4-a7b9-43ef-bb30-bcaa4a37411d	1	2025-11-20 18:56:26.963124+00
7	8e9b94eb-1962-4884-aace-b96a2c4146a7	dd6041b4-a7b9-43ef-bb30-bcaa4a37411d	8	2025-11-21 03:22:49.144043+00
8	3ad07d83-65ab-413c-b92c-4882cbedcbf3	dd6041b4-a7b9-43ef-bb30-bcaa4a37411d	26	2025-11-21 14:11:57.458796+00
9	7c55b668-d9ef-416c-b7d0-0e793f7b360e	dd6041b4-a7b9-43ef-bb30-bcaa4a37411d	4	2025-11-23 14:06:59.883252+00
10	75e8586f-79b2-4dcb-91aa-62bb6ff41662	dd6041b4-a7b9-43ef-bb30-bcaa4a37411d	14	2025-11-24 21:12:19.697638+00
11	1464410f-bfed-43e5-80ae-9b7b35efabaf	dd6041b4-a7b9-43ef-bb30-bcaa4a37411d	1	2025-11-25 22:05:11.056648+00
12	ca15f311-e842-4d94-be66-05bd756d5442	dd6041b4-a7b9-43ef-bb30-bcaa4a37411d	1	2025-11-26 14:25:56.664131+00
13	37b95ff3-5012-4a8b-b6ae-da8cd7d5b136	dd6041b4-a7b9-43ef-bb30-bcaa4a37411d	23	2025-11-28 23:34:31.092612+00
14	1188203d-5734-44a4-b722-4ba3a326ba3a	dd6041b4-a7b9-43ef-bb30-bcaa4a37411d	2	2025-12-05 10:20:48.336059+00
\.


--
-- Data for Name: audit_events; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.audit_events (id, actor_id, target_user_id, action, metadata, created_at) FROM stdin;
4fb25a23-322a-44b7-932b-cb21d4664c8a	49819811	49949376	group_deleted	{"groupId": "d9a2bad4-3314-4695-a89b-ba224b48bbd0", "deletedBy": "admin", "groupName": "Zanzibar February "}	2025-11-24 10:25:19.979759
c9ed5e7c-ae4d-439f-bfca-6de2fb8e7258	49819811	49819811	group_deleted	{"groupId": "d49a46de-2b2f-473a-a285-6fc9228c3385", "deletedBy": "admin", "groupName": "ajo"}	2025-11-24 10:25:28.150094
d2b03370-bcc5-487a-a8e8-9e1c67c1c556	49819811	49819811	group_deleted	{"groupId": "6e60f529-8570-44c2-8a0e-54a447e6e8ca", "deletedBy": "admin", "groupName": "new Ajo"}	2025-11-24 10:25:33.268154
39b0febc-2322-4ffd-b5a8-d678b1ea4686	49819811	49819811	group_deleted	{"groupId": "d14e770d-6d37-4667-95d1-0d0cc3f545eb", "deletedBy": "admin", "groupName": "T3st"}	2025-11-24 10:25:38.213832
\.


--
-- Data for Name: contributions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contributions (id, group_id, member_id, cycle, amount, status, date_paid, created_at, receipt_url) FROM stdin;
058c921f-e53e-4c59-8d11-47f941e0274a	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	e367d40f-30b5-4ab8-b48d-379a644a68cf	4	100000	pending	\N	2025-11-24 18:54:24.21162	\N
48a4a92f-2c96-4885-896d-054432d38949	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	e367d40f-30b5-4ab8-b48d-379a644a68cf	5	100000	pending	\N	2025-11-24 18:54:24.256195	\N
b959d4db-de21-4314-bedb-7bb89b6519e5	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	e367d40f-30b5-4ab8-b48d-379a644a68cf	6	100000	pending	\N	2025-11-24 18:54:24.300592	\N
45ca1584-e602-4f2f-b269-9ad9897eadb1	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	e367d40f-30b5-4ab8-b48d-379a644a68cf	7	100000	pending	\N	2025-11-24 18:54:24.345326	\N
7bfd58a0-5183-4b31-a2f5-3eba593a25f1	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	e367d40f-30b5-4ab8-b48d-379a644a68cf	8	100000	pending	\N	2025-11-24 18:54:24.389787	\N
a809f4b2-9468-41d1-b76b-bea30e754068	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	e367d40f-30b5-4ab8-b48d-379a644a68cf	9	100000	pending	\N	2025-11-24 18:54:24.434324	\N
efc731ee-1842-4b1f-8667-6f5a6ae9aae1	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	e367d40f-30b5-4ab8-b48d-379a644a68cf	10	100000	pending	\N	2025-11-24 18:54:24.478607	\N
d1f4ecad-a713-4305-9dce-d958f6dd0748	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	e367d40f-30b5-4ab8-b48d-379a644a68cf	11	100000	pending	\N	2025-11-24 18:54:24.523238	\N
1e688ee2-e5e0-48cf-bcda-24c06e261113	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	e367d40f-30b5-4ab8-b48d-379a644a68cf	12	100000	pending	\N	2025-11-24 18:54:24.567464	\N
fe194807-1cb9-4374-86f8-8c1ad9813f3b	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	e367d40f-30b5-4ab8-b48d-379a644a68cf	13	100000	pending	\N	2025-11-24 18:54:24.612313	\N
46160502-626e-49c7-9420-c619e7266992	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	ec38e479-1a42-4bf9-af32-f8f6353cd150	4	100000	pending	\N	2025-11-24 19:08:41.509	\N
d23d6d8b-84da-4f2e-be79-ce65c0c3fab9	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	ec38e479-1a42-4bf9-af32-f8f6353cd150	5	100000	pending	\N	2025-11-24 19:08:41.553782	\N
b9da6f46-fadd-4c69-a041-b59915982746	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	ec38e479-1a42-4bf9-af32-f8f6353cd150	6	100000	pending	\N	2025-11-24 19:08:41.598525	\N
ed173ce7-a93b-4a1d-8d60-69ab4b7a29d9	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	ec38e479-1a42-4bf9-af32-f8f6353cd150	7	100000	pending	\N	2025-11-24 19:08:41.642933	\N
323a23f6-7224-4b2a-9718-d6f5a268fafe	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	ec38e479-1a42-4bf9-af32-f8f6353cd150	8	100000	pending	\N	2025-11-24 19:08:41.687492	\N
d4e6e1ab-0118-4e0a-8585-5f8e9d8bbdf2	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	ec38e479-1a42-4bf9-af32-f8f6353cd150	9	100000	pending	\N	2025-11-24 19:08:41.732425	\N
eeed63cf-f4e4-410a-b934-7244792806be	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	ec38e479-1a42-4bf9-af32-f8f6353cd150	10	100000	pending	\N	2025-11-24 19:08:41.777297	\N
c0e82d06-0591-4777-a52b-333e10a1e0db	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	ec38e479-1a42-4bf9-af32-f8f6353cd150	11	100000	pending	\N	2025-11-24 19:08:41.821893	\N
6d38ea9b-ae07-421a-a7b9-b1382c96fa33	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	ec38e479-1a42-4bf9-af32-f8f6353cd150	12	100000	pending	\N	2025-11-24 19:08:41.866277	\N
cb1ad641-a176-4999-b263-4e514fafd50a	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	ec38e479-1a42-4bf9-af32-f8f6353cd150	13	100000	pending	\N	2025-11-24 19:08:41.910843	\N
7c8cb047-9e7a-4362-9042-fe9e13cb79ba	92d8388e-cfee-401b-b0ef-8f409cb4cf90	3ff4a6f0-c64e-4840-b439-05df40cbe0a8	5	5454	pending	\N	2025-11-24 19:08:42.465745	\N
19815ec6-285e-41ab-8b2a-47b43e3d4a7e	92d8388e-cfee-401b-b0ef-8f409cb4cf90	3ff4a6f0-c64e-4840-b439-05df40cbe0a8	6	5454	pending	\N	2025-11-24 19:08:42.511638	\N
aadbe5f4-9597-4910-87c7-025a3799741d	92d8388e-cfee-401b-b0ef-8f409cb4cf90	3ff4a6f0-c64e-4840-b439-05df40cbe0a8	7	5454	pending	\N	2025-11-24 19:08:42.557581	\N
2782766c-25d1-41a7-adaa-87fd2d31dc42	92d8388e-cfee-401b-b0ef-8f409cb4cf90	3ff4a6f0-c64e-4840-b439-05df40cbe0a8	8	5454	pending	\N	2025-11-24 19:08:42.603808	\N
ce602870-3e34-4dd2-9481-7686b89df945	92d8388e-cfee-401b-b0ef-8f409cb4cf90	3ff4a6f0-c64e-4840-b439-05df40cbe0a8	9	5454	pending	\N	2025-11-24 19:08:42.650684	\N
17cb38ff-b59e-4c6e-8090-a157be5f0c7a	92d8388e-cfee-401b-b0ef-8f409cb4cf90	3ff4a6f0-c64e-4840-b439-05df40cbe0a8	10	5454	pending	\N	2025-11-24 19:08:42.696491	\N
2b093c74-16df-474f-82aa-0c341554c494	92d8388e-cfee-401b-b0ef-8f409cb4cf90	587905e5-ee31-4de2-ad55-d8eaa8b0b7ea	5	5454	pending	\N	2025-11-24 19:14:19.822021	\N
2ed69620-3175-41e8-bfd3-250efac61fe8	92d8388e-cfee-401b-b0ef-8f409cb4cf90	587905e5-ee31-4de2-ad55-d8eaa8b0b7ea	6	5454	pending	\N	2025-11-24 19:14:19.867	\N
da9ef111-8cdf-4801-92cb-84ac320e6d7d	92d8388e-cfee-401b-b0ef-8f409cb4cf90	587905e5-ee31-4de2-ad55-d8eaa8b0b7ea	7	5454	pending	\N	2025-11-24 19:14:19.912157	\N
06dd777b-e1aa-46e5-9740-91721076a544	92d8388e-cfee-401b-b0ef-8f409cb4cf90	587905e5-ee31-4de2-ad55-d8eaa8b0b7ea	8	5454	pending	\N	2025-11-24 19:14:19.956848	\N
92982671-dd43-4b44-96fb-4ae37dbfcac5	92d8388e-cfee-401b-b0ef-8f409cb4cf90	587905e5-ee31-4de2-ad55-d8eaa8b0b7ea	9	5454	pending	\N	2025-11-24 19:14:20.001495	\N
abc3bd0d-f645-4168-9ad1-ed150be2b9b6	92d8388e-cfee-401b-b0ef-8f409cb4cf90	587905e5-ee31-4de2-ad55-d8eaa8b0b7ea	10	5454	pending	\N	2025-11-24 19:14:20.047712	\N
3d0d0e3a-0db9-4620-bccf-68040c28ea9a	92d8388e-cfee-401b-b0ef-8f409cb4cf90	3ff4a6f0-c64e-4840-b439-05df40cbe0a8	3	5454	paid	2025-11-27	2025-11-24 19:08:42.373507	\N
32751ae8-8542-42a6-a5aa-cbb96ba40e6e	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	ec38e479-1a42-4bf9-af32-f8f6353cd150	3	100000	paid	2025-12-24	2025-11-24 19:08:41.462576	\N
fc3901d4-c5d8-416a-8739-7d714b5f91d2	92d8388e-cfee-401b-b0ef-8f409cb4cf90	82e245f1-7576-45e9-850b-fe60e285197c	1	5454	paid	2025-11-24	2025-11-24 19:14:29.587472	\N
39ed9675-6887-4c68-9b82-1b6c5715c709	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	ec38e479-1a42-4bf9-af32-f8f6353cd150	1	100000	paid	2025-11-25	2025-11-24 19:08:41.37155	\N
8f599e23-acc3-41bc-a8ee-085daa5d27a9	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	e367d40f-30b5-4ab8-b48d-379a644a68cf	1	100000	paid	2025-11-25	2025-11-24 18:54:24.07368	\N
07fbc583-938f-4ca7-ba19-49559545bf46	92d8388e-cfee-401b-b0ef-8f409cb4cf90	587905e5-ee31-4de2-ad55-d8eaa8b0b7ea	2	5454	paid	2025-11-26	2025-11-24 19:14:19.686813	\N
27881ed9-e563-47f3-838b-404955fa39ea	92d8388e-cfee-401b-b0ef-8f409cb4cf90	3ff4a6f0-c64e-4840-b439-05df40cbe0a8	4	5454	paid	2025-11-27	2025-11-24 19:08:42.41967	\N
5a2cfaeb-6a94-42a8-83cc-9cbe00d8d8a6	92d8388e-cfee-401b-b0ef-8f409cb4cf90	587905e5-ee31-4de2-ad55-d8eaa8b0b7ea	4	5454	paid	2025-11-27	2025-11-24 19:14:19.776805	\N
d6b0bff5-e3f4-4957-9444-fea94a3c4212	92d8388e-cfee-401b-b0ef-8f409cb4cf90	587905e5-ee31-4de2-ad55-d8eaa8b0b7ea	3	5454	paid	2025-11-27	2025-11-24 19:14:19.731773	\N
2e055f12-bdd3-4a61-a468-7257f5962821	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	e367d40f-30b5-4ab8-b48d-379a644a68cf	3	100000	paid	2025-12-18	2025-11-24 18:54:24.16656	\N
5469c50a-b7d5-4296-94ef-66a2c34eaf71	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	ec38e479-1a42-4bf9-af32-f8f6353cd150	2	100000	paid	2025-11-24	2025-11-24 19:08:41.418007	\N
46e4b0f1-df39-42d5-9003-12ff068339f9	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	e367d40f-30b5-4ab8-b48d-379a644a68cf	2	100000	paid	2025-11-27	2025-11-24 18:54:24.121796	\N
241f9b5f-401f-4c6c-8229-33636168887e	92d8388e-cfee-401b-b0ef-8f409cb4cf90	82e245f1-7576-45e9-850b-fe60e285197c	5	5454	pending	\N	2025-11-24 19:14:29.779157	\N
16833481-a24c-4727-877a-714d7590ceb3	92d8388e-cfee-401b-b0ef-8f409cb4cf90	82e245f1-7576-45e9-850b-fe60e285197c	6	5454	pending	\N	2025-11-24 19:14:29.825859	\N
aace529c-5fe1-4b80-839d-7a2f1f7e02ad	92d8388e-cfee-401b-b0ef-8f409cb4cf90	82e245f1-7576-45e9-850b-fe60e285197c	7	5454	pending	\N	2025-11-24 19:14:29.872154	\N
3b0bcd8b-72c7-4ce4-8dc0-ec6954487e9a	92d8388e-cfee-401b-b0ef-8f409cb4cf90	82e245f1-7576-45e9-850b-fe60e285197c	8	5454	pending	\N	2025-11-24 19:14:29.919521	\N
0c10c70b-a20a-401a-95ea-5f1a1e97e255	92d8388e-cfee-401b-b0ef-8f409cb4cf90	82e245f1-7576-45e9-850b-fe60e285197c	9	5454	pending	\N	2025-11-24 19:14:29.965698	\N
7e9db05d-6e00-4cba-a3a9-70ba3108f9f1	92d8388e-cfee-401b-b0ef-8f409cb4cf90	82e245f1-7576-45e9-850b-fe60e285197c	10	5454	pending	\N	2025-11-24 19:14:30.012031	\N
701628cf-985e-4c92-b3f0-b7cb8c0a4c55	92d8388e-cfee-401b-b0ef-8f409cb4cf90	564a268d-5de8-417c-99c7-86d30a245961	5	5454	pending	\N	2025-11-24 19:14:38.955145	\N
96368455-065f-4cfa-8530-19966d32c9d3	92d8388e-cfee-401b-b0ef-8f409cb4cf90	564a268d-5de8-417c-99c7-86d30a245961	6	5454	pending	\N	2025-11-24 19:14:38.999418	\N
1706d621-0933-47f9-abaa-cd6d5bee4a20	92d8388e-cfee-401b-b0ef-8f409cb4cf90	564a268d-5de8-417c-99c7-86d30a245961	7	5454	pending	\N	2025-11-24 19:14:39.044094	\N
20a39054-f9cd-48e5-8792-d5d7396185a9	92d8388e-cfee-401b-b0ef-8f409cb4cf90	564a268d-5de8-417c-99c7-86d30a245961	8	5454	pending	\N	2025-11-24 19:14:39.088531	\N
f15af9c3-77c7-4efa-99ca-cb79a3c078a5	92d8388e-cfee-401b-b0ef-8f409cb4cf90	564a268d-5de8-417c-99c7-86d30a245961	9	5454	pending	\N	2025-11-24 19:14:39.132923	\N
bc784a38-94be-4b7d-a088-233072690b5b	92d8388e-cfee-401b-b0ef-8f409cb4cf90	564a268d-5de8-417c-99c7-86d30a245961	10	5454	pending	\N	2025-11-24 19:14:39.177223	\N
8d70d71c-842c-4343-9278-792ddc1f2160	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	4cf2ff90-2b09-4b0a-ac22-beb0294a77bc	4	100000	pending	\N	2025-11-24 19:14:53.922804	\N
d97c93bd-ff1d-4359-ad12-89731449c9d2	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	4cf2ff90-2b09-4b0a-ac22-beb0294a77bc	5	100000	pending	\N	2025-11-24 19:14:53.967489	\N
cb03c8e0-2f1c-455b-b1b7-0a44c2f277f5	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	4cf2ff90-2b09-4b0a-ac22-beb0294a77bc	6	100000	pending	\N	2025-11-24 19:14:54.011966	\N
446662a0-6b5c-4fc5-b255-0e7d0fe7cf52	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	4cf2ff90-2b09-4b0a-ac22-beb0294a77bc	7	100000	pending	\N	2025-11-24 19:14:54.05656	\N
293492a5-c8a0-4168-87f1-d69a0f253f17	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	4cf2ff90-2b09-4b0a-ac22-beb0294a77bc	8	100000	pending	\N	2025-11-24 19:14:54.101193	\N
fb9eb4f2-f09e-4d23-aa92-51ad45be4b09	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	4cf2ff90-2b09-4b0a-ac22-beb0294a77bc	9	100000	pending	\N	2025-11-24 19:14:54.147152	\N
e81c5e02-1881-4e2f-9f80-00198e2f987d	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	4cf2ff90-2b09-4b0a-ac22-beb0294a77bc	10	100000	pending	\N	2025-11-24 19:14:54.193895	\N
61d7cb34-ca3a-4872-bfc7-b969c8bbfa58	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	4cf2ff90-2b09-4b0a-ac22-beb0294a77bc	11	100000	pending	\N	2025-11-24 19:14:54.23863	\N
70cb5169-1f7e-4fbe-bf91-c332e099c1e3	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	4cf2ff90-2b09-4b0a-ac22-beb0294a77bc	12	100000	pending	\N	2025-11-24 19:14:54.285217	\N
11e428d5-6b2c-4a63-a277-8594ef7507e2	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	4cf2ff90-2b09-4b0a-ac22-beb0294a77bc	13	100000	pending	\N	2025-11-24 19:14:54.329841	\N
fd515f79-5013-4496-9eac-2e75fe5d9879	92d8388e-cfee-401b-b0ef-8f409cb4cf90	82e245f1-7576-45e9-850b-fe60e285197c	4	5454	paid	2025-11-27	2025-11-24 19:14:29.726636	\N
b8673a00-3db9-4d83-a595-99dd3257e79e	92d8388e-cfee-401b-b0ef-8f409cb4cf90	587905e5-ee31-4de2-ad55-d8eaa8b0b7ea	1	5454	paid	2025-11-24	2025-11-24 19:14:19.641173	\N
3a31afdd-e984-4886-b794-34e0b52c0c12	92d8388e-cfee-401b-b0ef-8f409cb4cf90	3ff4a6f0-c64e-4840-b439-05df40cbe0a8	1	5454	paid	2025-11-24	2025-11-24 19:08:42.280426	\N
006ed87c-a8cf-438c-87b4-763fe6337f35	92d8388e-cfee-401b-b0ef-8f409cb4cf90	564a268d-5de8-417c-99c7-86d30a245961	1	5454	paid	2025-11-24	2025-11-24 19:14:38.776378	\N
59500d78-0c53-4715-80f4-34d785a03109	92d8388e-cfee-401b-b0ef-8f409cb4cf90	564a268d-5de8-417c-99c7-86d30a245961	4	5454	paid	2025-11-27	2025-11-24 19:14:38.910577	\N
6a56f10f-dd56-48ed-9215-5ef4b6708325	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	d77999c6-40ba-4b62-bc6d-8160d21b4547	3	100000	pending	\N	2025-11-24 19:21:34.030984	\N
bc7b488d-2b29-443e-a43d-44c16edd8ac5	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	d77999c6-40ba-4b62-bc6d-8160d21b4547	4	100000	pending	\N	2025-11-24 19:21:34.075285	\N
255a0ba7-6bcb-4261-a44e-c08a074b953d	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	d77999c6-40ba-4b62-bc6d-8160d21b4547	5	100000	pending	\N	2025-11-24 19:21:34.119137	\N
50b48845-9f65-4a45-804f-113f35fa957f	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	d77999c6-40ba-4b62-bc6d-8160d21b4547	6	100000	pending	\N	2025-11-24 19:21:34.1644	\N
6f8c863b-42fb-4886-8b7c-8092e9bfff95	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	d77999c6-40ba-4b62-bc6d-8160d21b4547	7	100000	pending	\N	2025-11-24 19:21:34.209047	\N
e54d3e25-b379-4504-833c-cad4bae71c00	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	d77999c6-40ba-4b62-bc6d-8160d21b4547	8	100000	pending	\N	2025-11-24 19:21:34.254101	\N
8294354a-129f-4f56-9d21-bc2ee5befbc9	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	d77999c6-40ba-4b62-bc6d-8160d21b4547	9	100000	pending	\N	2025-11-24 19:21:34.297684	\N
7af8d476-cc78-43d4-99f4-f5c98dff9a82	92d8388e-cfee-401b-b0ef-8f409cb4cf90	82e245f1-7576-45e9-850b-fe60e285197c	2	5454	paid	2025-11-26	2025-11-24 19:14:29.633993	\N
cfa037e2-0716-49b3-b617-830340bcdf6f	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	4cf2ff90-2b09-4b0a-ac22-beb0294a77bc	1	100000	paid	2025-11-25	2025-11-24 19:14:53.787963	\N
a96a2b9f-f3d2-41f9-8596-e3a9115ced2f	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	d77999c6-40ba-4b62-bc6d-8160d21b4547	1	100000	paid	2025-11-25	2025-11-24 19:21:33.942318	\N
c3464565-095f-48bf-8849-eece166652df	92d8388e-cfee-401b-b0ef-8f409cb4cf90	564a268d-5de8-417c-99c7-86d30a245961	2	5454	paid	2025-11-24	2025-11-24 19:14:38.821749	\N
7a4bba60-7330-45ef-b7aa-5115de29d77d	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	d77999c6-40ba-4b62-bc6d-8160d21b4547	2	100000	paid	2025-11-29	2025-11-24 19:21:33.986699	\N
46b11498-510c-4f80-9610-72ababfa2ac6	92d8388e-cfee-401b-b0ef-8f409cb4cf90	564a268d-5de8-417c-99c7-86d30a245961	3	5454	paid	2025-11-26	2025-11-24 19:14:38.865994	\N
e3b78da1-b17b-42c0-b542-45716f981371	92d8388e-cfee-401b-b0ef-8f409cb4cf90	82e245f1-7576-45e9-850b-fe60e285197c	3	5454	paid	2025-11-27	2025-11-24 19:14:29.680365	\N
ba0bac3b-059b-4557-ab10-c2237baf7754	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	4cf2ff90-2b09-4b0a-ac22-beb0294a77bc	3	100000	paid	2025-12-29	2025-11-24 19:14:53.877584	\N
ae880dd6-a7b0-437f-a825-15c807359bfb	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	4cf2ff90-2b09-4b0a-ac22-beb0294a77bc	2	100000	paid	2025-11-29	2025-11-24 19:14:53.832814	\N
81737d28-08cc-492f-83bb-b7e084ec250a	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	d77999c6-40ba-4b62-bc6d-8160d21b4547	10	100000	pending	\N	2025-11-24 19:21:34.342592	\N
574cd14d-d141-4fce-8f12-1d9c4d52a3de	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	d77999c6-40ba-4b62-bc6d-8160d21b4547	11	100000	pending	\N	2025-11-24 19:21:34.386621	\N
4d8b69e4-5a82-44a1-befa-222c888be971	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	d77999c6-40ba-4b62-bc6d-8160d21b4547	12	100000	pending	\N	2025-11-24 19:21:34.430503	\N
8942cde7-f73c-4284-9274-5f513f590b36	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	d77999c6-40ba-4b62-bc6d-8160d21b4547	13	100000	pending	\N	2025-11-24 19:21:34.474207	\N
5f479cf0-3ff6-4a52-a3f2-6deff9371883	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	8d338ba6-d9c8-41f6-828c-e4cd3e64e22d	4	100000	pending	\N	2025-11-24 19:29:15.274928	\N
8fb5b6c3-081b-4f99-9a0f-31ed44646483	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	8d338ba6-d9c8-41f6-828c-e4cd3e64e22d	5	100000	pending	\N	2025-11-24 19:29:15.32193	\N
2d6e0e29-f90d-4dc0-a0ad-cb29819da5a0	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	8d338ba6-d9c8-41f6-828c-e4cd3e64e22d	6	100000	pending	\N	2025-11-24 19:29:15.372793	\N
49449d99-6903-481d-a864-1c065f51d8a2	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	8d338ba6-d9c8-41f6-828c-e4cd3e64e22d	7	100000	pending	\N	2025-11-24 19:29:15.419301	\N
93f09b93-2dcf-490c-a035-8e03aca6b129	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	8d338ba6-d9c8-41f6-828c-e4cd3e64e22d	8	100000	pending	\N	2025-11-24 19:29:15.465677	\N
f42b79a8-1672-4fcc-9424-36f78bd8f1b3	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	8d338ba6-d9c8-41f6-828c-e4cd3e64e22d	9	100000	pending	\N	2025-11-24 19:29:15.512048	\N
d7093744-4bd1-4238-bd89-69dd960d0445	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	8d338ba6-d9c8-41f6-828c-e4cd3e64e22d	10	100000	pending	\N	2025-11-24 19:29:15.558306	\N
89d34b42-b370-42bc-aa8a-e0729e50fa9b	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	8d338ba6-d9c8-41f6-828c-e4cd3e64e22d	11	100000	pending	\N	2025-11-24 19:29:15.604531	\N
400cc25a-83c6-4512-a807-4d6bb14c10c9	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	8d338ba6-d9c8-41f6-828c-e4cd3e64e22d	12	100000	pending	\N	2025-11-24 19:29:15.651093	\N
ccb6f60f-b3a6-41e8-a794-7e83e148b945	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	8d338ba6-d9c8-41f6-828c-e4cd3e64e22d	13	100000	pending	\N	2025-11-24 19:29:15.697277	\N
c15c1298-9b5b-4a7a-8cfa-3d27b3395ca0	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	69bf4283-2570-4489-85f0-2240cb1a18bd	4	100000	pending	\N	2025-11-25 06:15:54.017432	\N
c0839425-54aa-4888-8438-45569bba2b2a	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	69bf4283-2570-4489-85f0-2240cb1a18bd	5	100000	pending	\N	2025-11-25 06:15:54.060626	\N
663b43c9-48fd-4a7a-a107-a59a23d94ee3	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	69bf4283-2570-4489-85f0-2240cb1a18bd	6	100000	pending	\N	2025-11-25 06:15:54.104502	\N
a78de9fc-a697-4fc5-9528-6d398f79e125	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	69bf4283-2570-4489-85f0-2240cb1a18bd	7	100000	pending	\N	2025-11-25 06:15:54.147971	\N
d0270765-3db3-4621-a247-4975605c759f	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	69bf4283-2570-4489-85f0-2240cb1a18bd	8	100000	pending	\N	2025-11-25 06:15:54.191305	\N
aaa0f979-cde2-4978-a51f-ff5c079d28b4	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	69bf4283-2570-4489-85f0-2240cb1a18bd	9	100000	pending	\N	2025-11-25 06:15:54.235079	\N
706d3b11-187a-46e8-8e52-ab5736bb8fa9	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	69bf4283-2570-4489-85f0-2240cb1a18bd	10	100000	pending	\N	2025-11-25 06:15:54.278511	\N
56b43990-a564-47ba-89b5-12c49b6b3aa2	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	69bf4283-2570-4489-85f0-2240cb1a18bd	11	100000	pending	\N	2025-11-25 06:15:54.321848	\N
b46af9e6-d3f5-4837-b4b6-44c5a9a38696	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	69bf4283-2570-4489-85f0-2240cb1a18bd	12	100000	pending	\N	2025-11-25 06:15:54.367635	\N
d70a16f7-aa41-4fe2-a63a-fb32323fd663	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	69bf4283-2570-4489-85f0-2240cb1a18bd	13	100000	pending	\N	2025-11-25 06:15:54.410925	\N
5355158f-14d3-431a-b381-0acdcbfdbde2	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	66905d03-c69b-4303-a30a-eb0964ba3211	4	100000	pending	\N	2025-11-25 19:08:03.388225	\N
68e88f2a-2321-4e28-ade4-63f850686563	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	66905d03-c69b-4303-a30a-eb0964ba3211	5	100000	pending	\N	2025-11-25 19:08:03.435426	\N
30dea604-5782-4e63-9302-e7ff2e5163b6	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	66905d03-c69b-4303-a30a-eb0964ba3211	6	100000	pending	\N	2025-11-25 19:08:03.484242	\N
dd93ef25-05ff-43b6-8877-84238fafb573	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	66905d03-c69b-4303-a30a-eb0964ba3211	7	100000	pending	\N	2025-11-25 19:08:03.533339	\N
8687f807-5217-42af-aebe-db3d81c9d0ae	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	66905d03-c69b-4303-a30a-eb0964ba3211	8	100000	pending	\N	2025-11-25 19:08:03.581595	\N
d3460162-3c02-4ce8-aac7-c3c7c4cbc20c	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	66905d03-c69b-4303-a30a-eb0964ba3211	9	100000	pending	\N	2025-11-25 19:08:03.628683	\N
73edc179-8504-4e63-a521-e3915154fa5b	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	66905d03-c69b-4303-a30a-eb0964ba3211	10	100000	pending	\N	2025-11-25 19:08:03.676115	\N
f826463d-07c1-4eb6-b4a3-6cb0048c88b1	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	66905d03-c69b-4303-a30a-eb0964ba3211	11	100000	pending	\N	2025-11-25 19:08:03.723302	\N
90e94967-7267-410b-9b0b-c0a89ee7829a	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	66905d03-c69b-4303-a30a-eb0964ba3211	12	100000	pending	\N	2025-11-25 19:08:03.771261	\N
1c01cfba-87de-4b80-b956-367e4e1f3a74	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	66905d03-c69b-4303-a30a-eb0964ba3211	13	100000	pending	\N	2025-11-25 19:08:03.820401	\N
5a2e567c-c81f-407f-a11a-2796c5d80c25	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	37cc043d-7d3b-40ac-84c2-a01cdc823c30	4	100000	pending	\N	2025-11-25 19:16:23.017737	\N
ff829817-8746-4dad-bcd7-05233f89555b	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	8d338ba6-d9c8-41f6-828c-e4cd3e64e22d	2	100000	paid	2025-11-28	2025-11-24 19:29:15.1821	\N
d04eda65-ac1b-4e6c-9d5d-65d26ba0d397	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	69bf4283-2570-4489-85f0-2240cb1a18bd	3	100000	paid	2025-12-29	2025-11-25 06:15:53.97358	uploads/receipts/receipt-1767013342741-544689307.jpeg
e48a067f-c585-4f4e-a458-c21f54095c68	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	37cc043d-7d3b-40ac-84c2-a01cdc823c30	1	100000	paid	2025-11-25	2025-11-25 19:16:22.881241	\N
d34730c1-697f-4a03-a3cf-da99e76c5e7e	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	8d338ba6-d9c8-41f6-828c-e4cd3e64e22d	3	100000	paid	2025-12-31	2025-11-24 19:29:15.228448	uploads/receipts/receipt-1767191657220-401679485.jpg
d2ffbd51-852f-4e02-9f5e-8fcc51fb62d1	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	66905d03-c69b-4303-a30a-eb0964ba3211	3	100000	paid	2025-12-31	2025-11-25 19:08:03.34005	uploads/receipts/receipt-1767201530273-822991835.jpg
185321f4-7161-4db6-8b18-ca177266c1d7	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	69bf4283-2570-4489-85f0-2240cb1a18bd	2	100000	paid	2025-11-29	2025-11-25 06:15:53.930094	\N
7a043712-0a8f-4dfd-86d2-af79a935cb36	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	37cc043d-7d3b-40ac-84c2-a01cdc823c30	3	100000	paid	2025-12-31	2025-11-25 19:16:22.974124	\N
e95d2a87-5bee-445c-a912-eac094893e85	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	37cc043d-7d3b-40ac-84c2-a01cdc823c30	5	100000	pending	\N	2025-11-25 19:16:23.061346	\N
0332e637-86ec-482a-bf80-17a43e2fe8cf	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	37cc043d-7d3b-40ac-84c2-a01cdc823c30	6	100000	pending	\N	2025-11-25 19:16:23.105944	\N
e5724a17-92bf-401a-a0f4-b536d2b9eb07	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	37cc043d-7d3b-40ac-84c2-a01cdc823c30	7	100000	pending	\N	2025-11-25 19:16:23.149443	\N
a15c6b59-ab26-407e-b944-a5a67bc67d67	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	37cc043d-7d3b-40ac-84c2-a01cdc823c30	8	100000	pending	\N	2025-11-25 19:16:23.192912	\N
4f37aa62-4dba-4a9b-b4c1-210e1487fdbb	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	37cc043d-7d3b-40ac-84c2-a01cdc823c30	9	100000	pending	\N	2025-11-25 19:16:23.236875	\N
dc05e7bf-b5c5-4c9e-a4ce-dbd6749f1c70	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	37cc043d-7d3b-40ac-84c2-a01cdc823c30	10	100000	pending	\N	2025-11-25 19:16:23.28052	\N
1920f15e-bb16-4d8b-ba57-73c03059b7e7	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	37cc043d-7d3b-40ac-84c2-a01cdc823c30	11	100000	pending	\N	2025-11-25 19:16:23.325006	\N
d96a8229-4315-4a62-83dc-4a0115cf1807	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	37cc043d-7d3b-40ac-84c2-a01cdc823c30	12	100000	pending	\N	2025-11-25 19:16:23.368819	\N
6bf1a77c-b039-4641-af00-b9ae8601b829	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	37cc043d-7d3b-40ac-84c2-a01cdc823c30	13	100000	pending	\N	2025-11-25 19:16:23.416023	\N
453de417-0163-4f2e-911a-93896845c5d2	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42998d33-b3e8-4a57-8c8c-8b37528c2501	4	100000	pending	\N	2025-11-25 20:08:00.721525	\N
e744ff9d-bdf2-48f2-98ee-a9322cf3b2fe	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42998d33-b3e8-4a57-8c8c-8b37528c2501	5	100000	pending	\N	2025-11-25 20:08:00.77055	\N
f78463af-d4cc-47b8-a2ee-bbf68ab4674f	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42998d33-b3e8-4a57-8c8c-8b37528c2501	6	100000	pending	\N	2025-11-25 20:08:00.818457	\N
e51915a3-6a8c-42a6-b8b7-681d4cbe89a4	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42998d33-b3e8-4a57-8c8c-8b37528c2501	7	100000	pending	\N	2025-11-25 20:08:00.866167	\N
3e2e3f1d-107e-4d38-9ea2-250ff56a5d92	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42998d33-b3e8-4a57-8c8c-8b37528c2501	8	100000	pending	\N	2025-11-25 20:08:00.913855	\N
cee39229-dd43-4d17-b7e9-6947dfa2dc4b	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42998d33-b3e8-4a57-8c8c-8b37528c2501	9	100000	pending	\N	2025-11-25 20:08:00.961437	\N
a5b1b741-e50d-458f-aa72-a1e60acd7e73	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42998d33-b3e8-4a57-8c8c-8b37528c2501	10	100000	pending	\N	2025-11-25 20:08:01.009191	\N
8aa68efb-40e0-43f3-8028-a36d9ba38206	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42998d33-b3e8-4a57-8c8c-8b37528c2501	11	100000	pending	\N	2025-11-25 20:08:01.057011	\N
6bf5db92-f96a-4eef-a8de-b8ad6b85b4f3	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42998d33-b3e8-4a57-8c8c-8b37528c2501	12	100000	pending	\N	2025-11-25 20:08:01.106071	\N
46fd48a6-4e51-453f-9a2f-3f992df2593a	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42998d33-b3e8-4a57-8c8c-8b37528c2501	13	100000	pending	\N	2025-11-25 20:08:01.15401	\N
07ed6dd1-d563-4c3d-b706-16cc702ed0a9	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42997990-4c0f-43e1-ab6f-efd9927c9568	4	100000	pending	\N	2025-11-25 20:14:48.067723	\N
d12447d6-984d-481c-bbbc-825f497cbb13	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42997990-4c0f-43e1-ab6f-efd9927c9568	5	100000	pending	\N	2025-11-25 20:14:48.112748	\N
9199806b-4128-43d3-85f4-62f55e57ba90	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42997990-4c0f-43e1-ab6f-efd9927c9568	6	100000	pending	\N	2025-11-25 20:14:48.158739	\N
3e6200f3-a935-43fe-8981-591094ea3715	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42997990-4c0f-43e1-ab6f-efd9927c9568	7	100000	pending	\N	2025-11-25 20:14:48.203188	\N
4100da19-0a8a-445c-8b50-c715f35291c1	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42997990-4c0f-43e1-ab6f-efd9927c9568	8	100000	pending	\N	2025-11-25 20:14:48.247956	\N
b099847c-571b-4bae-9b81-a98106f2fa96	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42997990-4c0f-43e1-ab6f-efd9927c9568	9	100000	pending	\N	2025-11-25 20:14:48.293175	\N
0a3b5cbe-355c-4b63-bd5d-b4a8130545b0	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42997990-4c0f-43e1-ab6f-efd9927c9568	10	100000	pending	\N	2025-11-25 20:14:48.339257	\N
68070a0a-a2e5-4b73-ad1a-77c0d965215a	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42997990-4c0f-43e1-ab6f-efd9927c9568	11	100000	pending	\N	2025-11-25 20:14:48.384082	\N
791471a6-ed70-4dec-a1c7-412fdf23f7ea	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42997990-4c0f-43e1-ab6f-efd9927c9568	12	100000	pending	\N	2025-11-25 20:14:48.428659	\N
b652d8c7-ba74-4220-b5c1-0ae1c824c6cd	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42997990-4c0f-43e1-ab6f-efd9927c9568	13	100000	pending	\N	2025-11-25 20:14:48.473247	\N
8ba6fa77-39cf-437b-b425-c0bd4c3b99db	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	141ff71a-73fa-4e5c-9b09-cc1f8c61a754	4	100000	pending	\N	2025-11-25 20:17:59.876187	\N
a1439924-60a9-4c07-a698-e4a0f5d1b4fa	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	141ff71a-73fa-4e5c-9b09-cc1f8c61a754	5	100000	pending	\N	2025-11-25 20:17:59.919891	\N
ad2cf9b3-957a-4b1e-a1cd-96fb5e3cb8a8	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	141ff71a-73fa-4e5c-9b09-cc1f8c61a754	6	100000	pending	\N	2025-11-25 20:17:59.963965	\N
14414b86-71c4-4957-acac-21495bdfe113	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	141ff71a-73fa-4e5c-9b09-cc1f8c61a754	7	100000	pending	\N	2025-11-25 20:18:00.008407	\N
eb88a1e8-3234-4160-9a5f-d632ed4f1a0f	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	141ff71a-73fa-4e5c-9b09-cc1f8c61a754	8	100000	pending	\N	2025-11-25 20:18:00.052595	\N
de577ea3-57e2-4f08-a808-748207f907de	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	141ff71a-73fa-4e5c-9b09-cc1f8c61a754	9	100000	pending	\N	2025-11-25 20:18:00.096218	\N
4a8050e2-5722-46e8-a885-f62e1465b588	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	141ff71a-73fa-4e5c-9b09-cc1f8c61a754	10	100000	pending	\N	2025-11-25 20:18:00.140531	\N
61e874f7-12ba-40d5-a9e1-ad3b77378b9f	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	141ff71a-73fa-4e5c-9b09-cc1f8c61a754	11	100000	pending	\N	2025-11-25 20:18:00.184445	\N
a9b9fd34-c910-45f1-ba3b-4c74833ca565	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	141ff71a-73fa-4e5c-9b09-cc1f8c61a754	12	100000	pending	\N	2025-11-25 20:18:00.232067	\N
550161b9-8214-48ed-99e8-2db70bbfa192	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42997990-4c0f-43e1-ab6f-efd9927c9568	3	100000	paid	2025-12-22	2025-11-25 20:14:48.022754	\N
bac40648-e1c3-41c3-962b-8c7459c5f97a	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42997990-4c0f-43e1-ab6f-efd9927c9568	1	100000	paid	2025-11-25	2025-11-25 20:14:47.930183	\N
36f93e96-dea6-43ac-9ebc-45fd7e19ebb8	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42998d33-b3e8-4a57-8c8c-8b37528c2501	3	100000	paid	2025-12-31	2025-11-25 20:08:00.67356	\N
a88b3da0-19a2-4ac8-bf84-a1efc36c2970	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	141ff71a-73fa-4e5c-9b09-cc1f8c61a754	3	100000	paid	2025-12-30	2025-11-25 20:17:59.832036	uploads/receipts/receipt-1767131482144-317915109.jpg
b764f0ba-8e75-45a3-aee1-efec6c82cd29	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	141ff71a-73fa-4e5c-9b09-cc1f8c61a754	2	100000	paid	2025-11-25	2025-11-25 20:17:59.788283	\N
240c1bfe-1f10-494f-909e-11f5f792bcb3	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	141ff71a-73fa-4e5c-9b09-cc1f8c61a754	13	100000	pending	\N	2025-11-25 20:18:00.276348	\N
8a3d38fa-b487-4e0b-9a06-bbd095506a49	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	edcc834c-174a-4505-b258-ee72e5788833	4	100000	pending	\N	2025-11-25 20:27:47.120983	\N
564ee0f9-4e18-4fba-a996-de6f5e43fb86	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	edcc834c-174a-4505-b258-ee72e5788833	5	100000	pending	\N	2025-11-25 20:27:47.165555	\N
ab6f7a5b-5f1d-4307-8ba1-0c854898277b	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	edcc834c-174a-4505-b258-ee72e5788833	6	100000	pending	\N	2025-11-25 20:27:47.210691	\N
47b409b9-e6ae-42ca-b3d4-7ef8a3fbe5a6	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	edcc834c-174a-4505-b258-ee72e5788833	7	100000	pending	\N	2025-11-25 20:27:47.255165	\N
3de909d7-bfaa-4d73-9891-1826c9a5e16b	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	edcc834c-174a-4505-b258-ee72e5788833	8	100000	pending	\N	2025-11-25 20:27:47.29889	\N
844b3f01-49f0-48fd-b49f-94fe66925ed6	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	edcc834c-174a-4505-b258-ee72e5788833	9	100000	pending	\N	2025-11-25 20:27:47.342766	\N
788e2e30-e502-4a32-be2a-26df339fad76	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	edcc834c-174a-4505-b258-ee72e5788833	10	100000	pending	\N	2025-11-25 20:27:47.386886	\N
63db2335-aecc-4a86-b351-c437ad5b360a	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	edcc834c-174a-4505-b258-ee72e5788833	11	100000	pending	\N	2025-11-25 20:27:47.430794	\N
6d1db1f6-1447-4f3f-b64f-2f4c5a034d70	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	edcc834c-174a-4505-b258-ee72e5788833	12	100000	pending	\N	2025-11-25 20:27:47.475238	\N
7593bd6f-c38a-48c2-a788-e47be3910454	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	edcc834c-174a-4505-b258-ee72e5788833	13	100000	pending	\N	2025-11-25 20:27:47.519278	\N
7937e6f5-fbf0-40cd-b126-9f59edd62aa7	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	0444eac9-5706-4f5b-bee3-8a98fcf836e7	4	100000	pending	\N	2025-11-25 20:28:11.872863	\N
b4790131-984a-4117-a235-15ec3ca6a765	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	0444eac9-5706-4f5b-bee3-8a98fcf836e7	5	100000	pending	\N	2025-11-25 20:28:11.919489	\N
0abf99be-fa64-4559-a69b-12083c0f3e60	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	0444eac9-5706-4f5b-bee3-8a98fcf836e7	6	100000	pending	\N	2025-11-25 20:28:11.965275	\N
4513c873-9956-42a0-90c0-a5b92cf45b8c	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	0444eac9-5706-4f5b-bee3-8a98fcf836e7	7	100000	pending	\N	2025-11-25 20:28:12.011384	\N
aba26f79-245f-4870-a41b-5cbcb7d90fd0	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	0444eac9-5706-4f5b-bee3-8a98fcf836e7	8	100000	pending	\N	2025-11-25 20:28:12.057635	\N
8e94e871-6a50-41a5-b836-03ac0a4cc49c	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	0444eac9-5706-4f5b-bee3-8a98fcf836e7	9	100000	pending	\N	2025-11-25 20:28:12.103454	\N
ae533bd5-d752-4864-9e50-651c08d02f9b	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	0444eac9-5706-4f5b-bee3-8a98fcf836e7	10	100000	pending	\N	2025-11-25 20:28:12.149384	\N
be5fee9f-1a91-4d47-ae28-a1fd45250fee	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	0444eac9-5706-4f5b-bee3-8a98fcf836e7	11	100000	pending	\N	2025-11-25 20:28:12.195423	\N
cd6758c5-7d3d-4581-b51c-5324d909242c	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	0444eac9-5706-4f5b-bee3-8a98fcf836e7	12	100000	pending	\N	2025-11-25 20:28:12.241396	\N
05baf5cc-7bbf-4114-8bf8-091e1405f107	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	0444eac9-5706-4f5b-bee3-8a98fcf836e7	13	100000	pending	\N	2025-11-25 20:28:12.287845	\N
d0fc11a2-6404-40a6-b6f2-29a11b1857a5	e28389b4-a386-4974-8d75-9d5fbe7608ed	ab99694b-1485-4934-b097-c957363065c3	2	500	pending	\N	2025-11-27 11:12:40.537502	\N
98dcb567-2acd-4dbd-be1a-3ac821a64b9f	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	8d338ba6-d9c8-41f6-828c-e4cd3e64e22d	1	100000	paid	2025-11-25	2025-11-24 19:29:15.135518	\N
c7aa6675-3c34-4427-9c85-d399c6e5edc5	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	69bf4283-2570-4489-85f0-2240cb1a18bd	1	100000	paid	2025-11-25	2025-11-25 06:15:53.883188	\N
70ac82d6-c8b5-4c2f-b502-880dffcb7953	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42998d33-b3e8-4a57-8c8c-8b37528c2501	1	100000	paid	2025-11-25	2025-11-25 20:08:00.576255	\N
8f779255-476f-4f1d-b305-efce8daf1d5f	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	141ff71a-73fa-4e5c-9b09-cc1f8c61a754	1	100000	paid	2025-11-25	2025-11-25 20:17:59.742797	\N
8d482fdc-13be-4279-a6ba-84c00f1f1078	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	66905d03-c69b-4303-a30a-eb0964ba3211	1	100000	paid	2025-11-25	2025-11-25 19:08:03.235128	\N
e3685999-483a-4508-8f03-774b4b509a82	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	edcc834c-174a-4505-b258-ee72e5788833	1	100000	paid	2025-11-25	2025-11-25 20:27:46.986585	\N
c87b69ac-1179-4eff-aab7-5e085084d304	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	0444eac9-5706-4f5b-bee3-8a98fcf836e7	1	100000	paid	2025-11-25	2025-11-25 20:28:11.732398	\N
4196926f-9ad8-44f8-a5a1-e441bc7f27be	92d8388e-cfee-401b-b0ef-8f409cb4cf90	3ff4a6f0-c64e-4840-b439-05df40cbe0a8	2	5454	paid	2025-11-26	2025-11-24 19:08:42.326783	\N
033a3637-cda8-486e-bf5d-1801093d3455	e28389b4-a386-4974-8d75-9d5fbe7608ed	6958e565-150b-4dfc-85ea-be2ed213038f	2	500	pending	\N	2025-11-27 11:11:24.789776	\N
edcd4c78-8326-461a-90b3-f7ebcf7a144b	e28389b4-a386-4974-8d75-9d5fbe7608ed	6958e565-150b-4dfc-85ea-be2ed213038f	3	500	pending	\N	2025-11-27 11:11:24.837881	\N
8a0806aa-573e-4f4c-bf2c-2d20299eaf57	e28389b4-a386-4974-8d75-9d5fbe7608ed	6958e565-150b-4dfc-85ea-be2ed213038f	4	500	pending	\N	2025-11-27 11:11:24.885305	\N
92efc25a-7dbc-4e66-8166-1c8099d6072b	e28389b4-a386-4974-8d75-9d5fbe7608ed	6958e565-150b-4dfc-85ea-be2ed213038f	5	500	pending	\N	2025-11-27 11:11:24.933317	\N
ba07bf48-f955-4e16-b617-212ef4b903e2	e28389b4-a386-4974-8d75-9d5fbe7608ed	ab99694b-1485-4934-b097-c957363065c3	3	500	pending	\N	2025-11-27 11:12:40.587721	\N
eb2e4d48-77de-4f8f-88ad-27e04b2206a4	e28389b4-a386-4974-8d75-9d5fbe7608ed	ab99694b-1485-4934-b097-c957363065c3	4	500	pending	\N	2025-11-27 11:12:40.632042	\N
c4de71ac-a034-4f81-9fd3-18875f56270d	e28389b4-a386-4974-8d75-9d5fbe7608ed	ab99694b-1485-4934-b097-c957363065c3	5	500	pending	\N	2025-11-27 11:12:40.676099	\N
40635159-fc82-4dbf-b831-9604d4dffab0	e28389b4-a386-4974-8d75-9d5fbe7608ed	cf7421e9-d32d-4853-9118-1cfccaed22ed	2	500	pending	\N	2025-11-27 11:12:48.007329	\N
256e9063-a046-4630-9ade-95bb4e6a9936	e28389b4-a386-4974-8d75-9d5fbe7608ed	cf7421e9-d32d-4853-9118-1cfccaed22ed	3	500	pending	\N	2025-11-27 11:12:48.052872	\N
490df289-4a16-4ce8-a260-06b9046ba7eb	e28389b4-a386-4974-8d75-9d5fbe7608ed	cf7421e9-d32d-4853-9118-1cfccaed22ed	4	500	pending	\N	2025-11-27 11:12:48.098179	\N
463fe1a2-8f4b-49fb-8324-ddf37e7610b2	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	edcc834c-174a-4505-b258-ee72e5788833	3	100000	paid	2025-12-31	2025-11-25 20:27:47.076783	\N
7ffe6254-712f-4f6f-af64-c3d49a87a727	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	0444eac9-5706-4f5b-bee3-8a98fcf836e7	2	100000	paid	2025-11-29	2025-11-25 20:28:11.779557	\N
51448836-1a5b-40cc-938e-725b46aea76b	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	0444eac9-5706-4f5b-bee3-8a98fcf836e7	3	100000	paid	2025-12-31	2025-11-25 20:28:11.825761	\N
b2b158e3-5035-4c05-914d-ab4b6809beea	e28389b4-a386-4974-8d75-9d5fbe7608ed	cf7421e9-d32d-4853-9118-1cfccaed22ed	1	500	paid	2025-12-17	2025-11-27 11:12:47.962023	\N
51a22e58-a4bc-423c-9321-8aa264ec6a65	e28389b4-a386-4974-8d75-9d5fbe7608ed	cf7421e9-d32d-4853-9118-1cfccaed22ed	5	500	pending	\N	2025-11-27 11:12:48.144218	\N
be650ccd-7f98-4b93-84d8-3e94264f6dcb	e28389b4-a386-4974-8d75-9d5fbe7608ed	c469d52a-3069-4ce4-ace5-5dc1b2c5b425	2	500	pending	\N	2025-11-27 11:13:10.290521	\N
c4cf7df6-fc8d-4348-a056-73f279e3ca8a	e28389b4-a386-4974-8d75-9d5fbe7608ed	c469d52a-3069-4ce4-ace5-5dc1b2c5b425	3	500	pending	\N	2025-11-27 11:13:10.335263	\N
47d792fb-bce0-4ee2-82ed-c9f7862cb008	e28389b4-a386-4974-8d75-9d5fbe7608ed	c469d52a-3069-4ce4-ace5-5dc1b2c5b425	4	500	pending	\N	2025-11-27 11:13:10.379867	\N
0d668687-54a8-4dce-8144-966e8f5aeab5	e28389b4-a386-4974-8d75-9d5fbe7608ed	c469d52a-3069-4ce4-ace5-5dc1b2c5b425	5	500	pending	\N	2025-11-27 11:13:10.424401	\N
fc728816-128a-4f52-9c66-866304c6ac41	4676ac83-d44b-449f-8829-52cde9ecbbbb	d922f194-5d28-4e94-9d67-f427be029373	1	100	pending	\N	2025-12-30 18:22:00.228955	\N
ec7eff1b-0e86-4b5a-915b-fc30e2724594	4676ac83-d44b-449f-8829-52cde9ecbbbb	d922f194-5d28-4e94-9d67-f427be029373	2	100	pending	\N	2025-12-30 18:22:00.27816	\N
37b6c1dc-67cc-4911-8be7-70ec952aa5a7	4676ac83-d44b-449f-8829-52cde9ecbbbb	d922f194-5d28-4e94-9d67-f427be029373	3	100	pending	\N	2025-12-30 18:22:00.322877	\N
5e8aa991-5e69-486b-92d2-40c332dc01c1	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	37cc043d-7d3b-40ac-84c2-a01cdc823c30	2	100000	paid	2025-11-30	2025-11-25 19:16:22.929696	\N
589acaf1-c7aa-4407-a73b-26e5dc03f92a	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	66905d03-c69b-4303-a30a-eb0964ba3211	2	100000	paid	2025-11-30	2025-11-25 19:08:03.287215	\N
7a9124ec-1d68-4ce3-8c4b-1df7d71ac702	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42997990-4c0f-43e1-ab6f-efd9927c9568	2	100000	paid	2025-11-25	2025-11-25 20:14:47.978114	\N
eb56ceb7-2bd7-4ef1-a6b3-e00b8e6487ea	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	42998d33-b3e8-4a57-8c8c-8b37528c2501	2	100000	paid	2025-11-27	2025-11-25 20:08:00.62577	\N
36604980-69e9-4c6d-b770-2e53a55a37e7	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	edcc834c-174a-4505-b258-ee72e5788833	2	100000	paid	2025-11-29	2025-11-25 20:27:47.030982	\N
7d1e8ced-165b-4735-9055-e6b66c61a9c4	cf52088b-ea41-45d3-a86d-f2318b8f7597	ed4e3ed4-4e6b-4c2d-9146-a366253f3254	1	12500	pending	\N	2025-12-17 11:45:57.872363	\N
205b4971-1d22-4a28-b404-80c0f8adbe57	cf52088b-ea41-45d3-a86d-f2318b8f7597	ed4e3ed4-4e6b-4c2d-9146-a366253f3254	2	12500	pending	\N	2025-12-17 11:45:57.926507	\N
c99728e5-c829-419b-a656-69c0d14d3831	cf52088b-ea41-45d3-a86d-f2318b8f7597	ed4e3ed4-4e6b-4c2d-9146-a366253f3254	3	12500	pending	\N	2025-12-17 11:45:57.974184	\N
749add76-8baa-45b6-9fd8-060899c2e9b1	cf52088b-ea41-45d3-a86d-f2318b8f7597	ed4e3ed4-4e6b-4c2d-9146-a366253f3254	4	12500	pending	\N	2025-12-17 11:45:58.018931	\N
fe60e434-5c01-4a57-8116-14c8affeb965	cf52088b-ea41-45d3-a86d-f2318b8f7597	ed4e3ed4-4e6b-4c2d-9146-a366253f3254	5	12500	pending	\N	2025-12-17 11:45:58.06455	\N
a105dfdc-9722-4c1a-a46f-727d1c463c62	cf52088b-ea41-45d3-a86d-f2318b8f7597	ed4e3ed4-4e6b-4c2d-9146-a366253f3254	6	12500	pending	\N	2025-12-17 11:45:58.109934	\N
b578419f-f570-4611-800c-6b63d75c0d20	cf52088b-ea41-45d3-a86d-f2318b8f7597	ed4e3ed4-4e6b-4c2d-9146-a366253f3254	7	12500	pending	\N	2025-12-17 11:45:58.154688	\N
ed4cd759-2c76-4a91-91f3-89528f995d84	cf52088b-ea41-45d3-a86d-f2318b8f7597	ed4e3ed4-4e6b-4c2d-9146-a366253f3254	8	12500	pending	\N	2025-12-17 11:45:58.200402	\N
6db2e74e-1fc3-47c4-ae57-8532f311ba1f	cf52088b-ea41-45d3-a86d-f2318b8f7597	ed4e3ed4-4e6b-4c2d-9146-a366253f3254	9	12500	pending	\N	2025-12-17 11:45:58.245049	\N
b50125e1-a77f-4c9d-b53e-4b076c666b26	cf52088b-ea41-45d3-a86d-f2318b8f7597	ed4e3ed4-4e6b-4c2d-9146-a366253f3254	10	12500	pending	\N	2025-12-17 11:45:58.29001	\N
d5628bd9-3df7-4445-81dd-cf7e72a6df3e	e28389b4-a386-4974-8d75-9d5fbe7608ed	ab99694b-1485-4934-b097-c957363065c3	1	500	paid	2025-12-17	2025-11-27 11:12:40.49263	\N
fbb48d84-822a-45c4-82da-bba8971bcf86	e28389b4-a386-4974-8d75-9d5fbe7608ed	6958e565-150b-4dfc-85ea-be2ed213038f	1	500	paid	2025-11-27	2025-11-27 11:11:24.74004	\N
dd88087f-c31c-4249-b21d-28dd0e15e926	e28389b4-a386-4974-8d75-9d5fbe7608ed	c469d52a-3069-4ce4-ace5-5dc1b2c5b425	1	500	paid	2025-11-29	2025-11-27 11:13:10.245319	\N
b3cefeb4-3157-48ce-862d-ea261140ee79	df0b52d4-a44d-45d2-8bbf-6b305fd766e4	a0e6c83c-4eeb-4745-af2f-f22ccd7f5956	1	12500	pending	\N	2025-12-22 09:53:36.577817	\N
c1c7ca5b-5f59-4b47-b184-06f3247c1bb9	df0b52d4-a44d-45d2-8bbf-6b305fd766e4	a0e6c83c-4eeb-4745-af2f-f22ccd7f5956	2	12500	pending	\N	2025-12-22 09:53:36.633337	\N
db3828db-197d-4319-87d0-42f05ead003b	df0b52d4-a44d-45d2-8bbf-6b305fd766e4	a0e6c83c-4eeb-4745-af2f-f22ccd7f5956	3	12500	pending	\N	2025-12-22 09:53:36.683456	\N
7aebbac4-fd21-495c-a6f6-c36046dfeeef	df0b52d4-a44d-45d2-8bbf-6b305fd766e4	a0e6c83c-4eeb-4745-af2f-f22ccd7f5956	4	12500	pending	\N	2025-12-22 09:53:36.728845	\N
e864dde5-ff63-4991-aafb-3cdf578bc977	df0b52d4-a44d-45d2-8bbf-6b305fd766e4	1f702ede-4f5f-4fe2-af12-12a14081b0ee	1	12500	pending	\N	2025-12-22 09:54:48.119829	\N
c1568792-3226-42ae-a41c-9d9639ee7000	df0b52d4-a44d-45d2-8bbf-6b305fd766e4	1f702ede-4f5f-4fe2-af12-12a14081b0ee	2	12500	pending	\N	2025-12-22 09:54:48.16649	\N
6575e7c6-13a7-48d3-af00-6b7fe9488c8f	df0b52d4-a44d-45d2-8bbf-6b305fd766e4	1f702ede-4f5f-4fe2-af12-12a14081b0ee	3	12500	pending	\N	2025-12-22 09:54:48.212064	\N
a97c451c-6e1f-46dd-9e08-97d419672c53	df0b52d4-a44d-45d2-8bbf-6b305fd766e4	1f702ede-4f5f-4fe2-af12-12a14081b0ee	4	12500	pending	\N	2025-12-22 09:54:48.257779	\N
71f86a29-09e3-469b-9c53-c3cf04c02aa7	10ca7945-e664-4cf4-b4b4-4ecb352ec48b	1024a829-55a5-4c0a-8847-e1a58ea4523c	1	500	pending	\N	2025-12-29 07:38:33.771486	\N
d35bfa12-e2c2-48a8-b947-3405e44659c1	10ca7945-e664-4cf4-b4b4-4ecb352ec48b	1024a829-55a5-4c0a-8847-e1a58ea4523c	2	500	pending	\N	2025-12-29 07:38:33.827782	\N
57c0e310-f838-4d06-a422-f2d49d53daba	10ca7945-e664-4cf4-b4b4-4ecb352ec48b	1024a829-55a5-4c0a-8847-e1a58ea4523c	3	500	pending	\N	2025-12-29 07:38:33.874923	\N
e24fac27-4db8-4cbb-9808-006576d20867	4676ac83-d44b-449f-8829-52cde9ecbbbb	ea6d2e8e-151d-40b0-be34-e7daa0f83582	1	100	pending	\N	2025-12-29 07:39:48.560514	\N
815d7be7-b62e-425b-b02d-48eee22c5f32	4676ac83-d44b-449f-8829-52cde9ecbbbb	ea6d2e8e-151d-40b0-be34-e7daa0f83582	2	100	pending	\N	2025-12-29 07:39:48.607786	\N
3e569e04-c97a-452a-af18-c9ab7c82f364	4676ac83-d44b-449f-8829-52cde9ecbbbb	ea6d2e8e-151d-40b0-be34-e7daa0f83582	3	100	pending	\N	2025-12-29 07:39:48.653834	\N
\.


--
-- Data for Name: data_exports; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.data_exports (id, user_id, export_type, status, file_url, file_name, file_size, expires_at, error_message, requested_at, completed_at) FROM stdin;
857ebd9b-b413-4fa6-9836-e036cce9eae6	49819811	contributions	completed	/api/exports/857ebd9b-b413-4fa6-9836-e036cce9eae6/download	export_49819811_1764372988221.csv	1118	2025-12-05 23:36:28.223	\N	2025-11-28 23:36:27.763484	2025-11-28 23:36:28.223
\.


--
-- Data for Name: device_tokens; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.device_tokens (id, user_id, token, platform, device_name, is_active, last_used, created_at) FROM stdin;
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.groups (id, name, contribution_amount, frequency, status, current_cycle, total_cycles, next_collection_date, start_date, created_at, currency, user_id, visibility, max_members, go_live_date, is_live, completed_at, adjusted_go_live_date, payout_medium, schedule_visibility, recipient_visibility) FROM stdin;
92d8388e-cfee-401b-b0ef-8f409cb4cf90	Test	5454	weekly	completed	4	4	2025-12-29	2025-11-24	2025-11-24 19:08:42.13465	GBP	49819811	closed	\N	2025-11-27 00:06:00	1	2025-11-27 11:13:43.058	2025-11-24 19:15:34.654	admin	1	1
cf52088b-ea41-45d3-a86d-f2318b8f7597	Latexx 	12500	weekly	pending	1	10	2025-12-24	2025-12-17	2025-12-17 11:45:57.721148	NGN	1c8ca7f6-6bb6-4825-84b5-97bc5f15c202	open	10	2025-12-17 22:45:00	0	\N	\N	cycle_receiver	1	1
df0b52d4-a44d-45d2-8bbf-6b305fd766e4	Esusu 	12500	weekly	pending	1	4	2025-12-29	2025-12-22	2025-12-22 09:53:36.425633	NGN	cba7c48f-dd6e-48a4-b0fd-53e8dbeefc06	closed	\N	2025-12-28 17:00:00	0	\N	\N	cycle_receiver	1	1
e571c646-f7c3-430c-9a29-c3e1bc8fc3df	Thrift Naija 	100000	monthly	active	3	13	2025-12-30	2025-11-24	2025-11-24 18:54:23.869985	NGN	83cf805b-62e0-41b2-8aef-48502149ec65	closed	\N	2025-11-27 19:51:00	1	\N	2025-11-25 20:41:00.191	admin	0	0
10ca7945-e664-4cf4-b4b4-4ecb352ec48b	Tester	500	monthly	pending	1	3	2026-02-01	2025-12-29	2025-12-29 07:38:33.604896	USD	b8ab5ed9-0a90-4fd5-b3c2-732d4b7876f2	closed	\N	2026-01-01 07:38:33.059	0	\N	\N	admin	1	1
4676ac83-d44b-449f-8829-52cde9ecbbbb	Lets see	100	monthly	pending	1	3	2026-02-01	2025-12-29	2025-12-29 07:39:48.411245	NGN	49819811	closed	\N	2026-01-01 07:39:47.483	0	\N	\N	admin	1	1
e28389b4-a386-4974-8d75-9d5fbe7608ed	Tester	500	monthly	active	2	4	2026-01-03	2025-11-27	2025-11-27 11:11:24.585146	NGN	49819811	closed	\N	2025-11-27 12:11:00	1	\N	2025-11-27 11:13:59.345	cycle_receiver	1	1
\.


--
-- Data for Name: invite_links; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.invite_links (id, group_id, token, created_by, expires_at, max_uses, used_count, created_at) FROM stdin;
e7424407-35c2-4cfe-9aea-a33ae4aaa12e	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	44a1066d-71de-45c5-a851-a882a46d2d43	83cf805b-62e0-41b2-8aef-48502149ec65	2025-12-01 18:59:19.557	\N	0	2025-11-24 18:59:19.718367
0686c63d-2fb0-4a1a-a9a6-188073ca6a90	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	96aa7675-c502-491a-a61f-a61a801c66b1	83cf805b-62e0-41b2-8aef-48502149ec65	2025-12-01 18:59:41.691	\N	0	2025-11-24 18:59:41.848587
1047dd6c-ad19-4771-a6ef-f83aebf96122	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	904b26c4-a0fa-452d-bcd4-4cb78029e02a	83cf805b-62e0-41b2-8aef-48502149ec65	2025-12-01 18:59:53.38	\N	10	2025-11-24 18:59:53.816574
444e3b80-1c63-484e-9ca8-495a7bd88967	e28389b4-a386-4974-8d75-9d5fbe7608ed	059587d8-6650-499e-9fd9-23ee7d609212	49819811	2025-12-04 11:12:16.612	\N	1	2025-11-27 11:12:17.028511
c30eb2c7-09fe-45d9-8561-0d260200a4b3	e28389b4-a386-4974-8d75-9d5fbe7608ed	1d666fcd-a2c3-46a8-91c0-977ce160dcf1	49819811	\N	\N	0	2025-12-29 12:19:28.696713
deb377a1-87d7-4d13-8d2f-c4a328dea5ed	4676ac83-d44b-449f-8829-52cde9ecbbbb	6ae09a78-1457-420d-b43d-87c15954f230	49819811	\N	\N	0	2025-12-29 12:24:04.535747
7a3d78dd-aa38-40c1-b212-74f31af5c344	4676ac83-d44b-449f-8829-52cde9ecbbbb	6e270509-ec86-42ee-b23c-e30e518092f6	49819811	\N	\N	1	2025-12-30 18:21:00.688206
\.


--
-- Data for Name: join_requests; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.join_requests (id, group_id, user_id, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: members; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.members (id, group_id, name, phone, avatar, join_date, status, rotation_order, user_id, role, can_post_in_group, is_admin) FROM stdin;
d77999c6-40ba-4b62-bc6d-8160d21b4547	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	Tobi T	+447531226814	\N	2025-11-24	active	5	8019b8c3-ffac-4403-a9c7-8da97f3a0201	participant	1	0
e367d40f-30b5-4ab8-b48d-379a644a68cf	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	Damilola Oyewusi	07500688146	\N	2025-11-24	active	6	83cf805b-62e0-41b2-8aef-48502149ec65	creator	1	0
3ff4a6f0-c64e-4840-b439-05df40cbe0a8	92d8388e-cfee-401b-b0ef-8f409cb4cf90	Afolabi Ajao	+447846779604	\N	2025-11-24	active	1	49819811	creator	1	0
587905e5-ee31-4de2-ad55-d8eaa8b0b7ea	92d8388e-cfee-401b-b0ef-8f409cb4cf90	bhjgsfdsdfs	546546654645465546	\N	2025-11-24	active	2	\N	participant	1	0
82e245f1-7576-45e9-850b-fe60e285197c	92d8388e-cfee-401b-b0ef-8f409cb4cf90	gydwfghdf	544544448488484845	\N	2025-11-24	active	3	\N	participant	1	0
564a268d-5de8-417c-99c7-86d30a245961	92d8388e-cfee-401b-b0ef-8f409cb4cf90	hhrrhrrh	8448465645564564	\N	2025-11-24	active	4	\N	participant	1	0
141ff71a-73fa-4e5c-9b09-cc1f8c61a754	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	Omolola Ojebode 	08035255760	\N	2025-11-25	active	1	c786a4c7-d707-4c6e-bd60-07c776e53fd8	participant	1	0
42997990-4c0f-43e1-ab6f-efd9927c9568	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	Olutomi Oluranti	08050935286	\N	2025-11-25	active	2	34bb4a68-2527-42b3-89b8-930bc1531f1f	participant	1	0
4cf2ff90-2b09-4b0a-ac22-beb0294a77bc	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	Awoniyi Nofisat	4435919410	\N	2025-11-24	active	3	b75b95a1-9a6e-4c71-8828-2a1faeeff3d3	participant	1	0
ec38e479-1a42-4bf9-af32-f8f6353cd150	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	abiodun ajoke	08107332277	\N	2025-11-24	active	4	8a282915-d781-46a8-b13a-1206a9d755ee	participant	1	0
66905d03-c69b-4303-a30a-eb0964ba3211	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	Adeleye Oyinkansola omobolanle 	09120369788	\N	2025-11-25	active	7	bc76b4c4-cb02-4a9e-834b-dd19837ad520	participant	1	0
edcc834c-174a-4505-b258-ee72e5788833	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	Anonymous TN	070588744995	\N	2025-11-25	active	8	\N	participant	1	0
37cc043d-7d3b-40ac-84c2-a01cdc823c30	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	Zainab olamide 	09161924315	\N	2025-11-25	active	9	51a29157-c2e4-4b51-8c2c-1cfb6d091ca6	participant	1	0
0444eac9-5706-4f5b-bee3-8a98fcf836e7	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	Anonymous T	08050935286	\N	2025-11-25	active	10	\N	participant	1	0
8d338ba6-d9c8-41f6-828c-e4cd3e64e22d	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	Olabode 	07018002750	\N	2025-11-24	active	11	d288a950-84af-4c49-a071-fa170bdc8c48	participant	1	0
42998d33-b3e8-4a57-8c8c-8b37528c2501	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	Odulana adesewa 	08145548555	\N	2025-11-25	active	12	61af93e1-e004-4895-8434-da8d81fcaa79	participant	1	0
69bf4283-2570-4489-85f0-2240cb1a18bd	e571c646-f7c3-430c-9a29-c3e1bc8fc3df	Modupeola Adewunmi	07081301987	\N	2025-11-25	active	13	4f5c043b-6882-448d-a638-071c81802d9e	participant	1	0
6958e565-150b-4dfc-85ea-be2ed213038f	e28389b4-a386-4974-8d75-9d5fbe7608ed	Afolabi Ajao	+447846779604	\N	2025-11-27	active	1	49819811	creator	1	0
cf7421e9-d32d-4853-9118-1cfccaed22ed	e28389b4-a386-4974-8d75-9d5fbe7608ed	Gsgsgsgs	64840404048484	\N	2025-11-27	active	3	\N	participant	1	0
c469d52a-3069-4ce4-ace5-5dc1b2c5b425	e28389b4-a386-4974-8d75-9d5fbe7608ed	Tobi T	+447531226814	\N	2025-11-27	active	4	8019b8c3-ffac-4403-a9c7-8da97f3a0201	participant	1	0
ed4e3ed4-4e6b-4c2d-9146-a366253f3254	cf52088b-ea41-45d3-a86d-f2318b8f7597	Abosede Adeosun	07011735100	\N	2025-12-17	active	1	1c8ca7f6-6bb6-4825-84b5-97bc5f15c202	creator	1	0
a0e6c83c-4eeb-4745-af2f-f22ccd7f5956	df0b52d4-a44d-45d2-8bbf-6b305fd766e4	Folasade  Adedoyin	08025811796	\N	2025-12-22	active	1	cba7c48f-dd6e-48a4-b0fd-53e8dbeefc06	creator	1	0
1f702ede-4f5f-4fe2-af12-12a14081b0ee	df0b52d4-a44d-45d2-8bbf-6b305fd766e4	Latifat	+2348113329194	\N	2025-12-22	active	2	\N	participant	1	0
1024a829-55a5-4c0a-8847-e1a58ea4523c	10ca7945-e664-4cf4-b4b4-4ecb352ec48b	itteam@algoscapeinnovat.io		\N	2025-12-29	active	1	b8ab5ed9-0a90-4fd5-b3c2-732d4b7876f2	creator	1	0
ea6d2e8e-151d-40b0-be34-e7daa0f83582	4676ac83-d44b-449f-8829-52cde9ecbbbb	Afolabi Ajao	+447846779604	\N	2025-12-29	active	1	49819811	creator	1	0
d922f194-5d28-4e94-9d67-f427be029373	4676ac83-d44b-449f-8829-52cde9ecbbbb	Tobi T	+447531226814	\N	2025-12-30	active	2	8019b8c3-ffac-4403-a9c7-8da97f3a0201	participant	1	0
ab99694b-1485-4934-b097-c957363065c3	e28389b4-a386-4974-8d75-9d5fbe7608ed	Gsgs	5454884949484	\N	2025-11-27	active	2	\N	participant	1	1
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.messages (id, group_id, sender_id, recipient_id, type, content, created_at) FROM stdin;
dc8c4bb0-11d8-455d-b1d7-2291744c8a05	\N	49946820	49946820	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-20 09:30:39.575259
9dd53986-f5dd-4058-b774-513bf9d2940e	\N	49949376	49949376	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-20 10:53:19.690256
e07345ee-2a00-4883-984f-54b2f3199d09	\N	49965980	49965980	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-20 18:23:32.548008
6f7bf60e-3252-41c1-bc9a-583964e6dc0f	\N	737439f1-1be7-4609-8419-dde643af05f8	737439f1-1be7-4609-8419-dde643af05f8	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-21 03:49:30.149271
7ba62d50-492c-4e9a-a1c4-244e7b86f42a	\N	fe5409f9-f401-4b74-9fbd-d8aefd19cacb	fe5409f9-f401-4b74-9fbd-d8aefd19cacb	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-21 10:11:01.557168
31aacc74-3d8e-4412-96b7-d4520fdf82fe	\N	103a533f-c3ef-446e-9a2c-90a7602868d6	103a533f-c3ef-446e-9a2c-90a7602868d6	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-22 16:19:56.74813
78233523-a0e5-4fa4-8783-9ecd9ee2977e	\N	8019b8c3-ffac-4403-a9c7-8da97f3a0201	8019b8c3-ffac-4403-a9c7-8da97f3a0201	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-23 21:20:01.441995
2dfcf744-fbe7-4455-b67a-d50696ac827b	\N	83cf805b-62e0-41b2-8aef-48502149ec65	83cf805b-62e0-41b2-8aef-48502149ec65	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-24 06:05:25.07686
e015a992-2caa-4a5b-a640-7717016336e0	\N	8ba73090-10e5-47ac-9737-95dff786f14e	8ba73090-10e5-47ac-9737-95dff786f14e	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-24 10:57:57.677769
bb2cfb1d-22e0-4a16-b711-8a04a50d7837	\N	4ffefa15-91fc-4d5e-9927-70e96c98096e	4ffefa15-91fc-4d5e-9927-70e96c98096e	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-24 18:06:47.916386
649163ff-0adf-43d9-a623-20ddd1a4daf6	\N	8a282915-d781-46a8-b13a-1206a9d755ee	8a282915-d781-46a8-b13a-1206a9d755ee	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-24 19:08:20.354786
4bb1e6ef-e185-443d-befe-7ab0710c841a	\N	b75b95a1-9a6e-4c71-8828-2a1faeeff3d3	b75b95a1-9a6e-4c71-8828-2a1faeeff3d3	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-24 19:14:26.646169
b9231a00-13ba-4d6c-8492-cf34cab156a3	\N	d288a950-84af-4c49-a071-fa170bdc8c48	d288a950-84af-4c49-a071-fa170bdc8c48	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-24 19:28:34.124854
b393b933-d69e-4b0b-bc74-6d6a63356036	\N	4f5c043b-6882-448d-a638-071c81802d9e	4f5c043b-6882-448d-a638-071c81802d9e	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-25 06:15:33.579626
2a3a9800-7650-4392-806e-cdfd257c377b	\N	0cbad486-8c35-4dae-8bc6-b545f43680ab	0cbad486-8c35-4dae-8bc6-b545f43680ab	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-25 12:57:15.615244
c9a064a7-1410-442b-a689-6b9cfbb5f5b7	\N	bc76b4c4-cb02-4a9e-834b-dd19837ad520	bc76b4c4-cb02-4a9e-834b-dd19837ad520	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-25 19:07:33.272155
5d9136aa-5902-4d6c-8a78-c72877918449	\N	51a29157-c2e4-4b51-8c2c-1cfb6d091ca6	51a29157-c2e4-4b51-8c2c-1cfb6d091ca6	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-25 19:15:55.169695
30a22350-07a4-4665-814d-046516361859	\N	34bb4a68-2527-42b3-89b8-930bc1531f1f	34bb4a68-2527-42b3-89b8-930bc1531f1f	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-25 20:04:17.141225
975fef1f-830e-41a7-9331-8ba6444dd2f9	\N	61af93e1-e004-4895-8434-da8d81fcaa79	61af93e1-e004-4895-8434-da8d81fcaa79	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-25 20:07:31.642341
e78b8cb5-4b1c-43ae-858e-c25d37a2d122	\N	c786a4c7-d707-4c6e-bd60-07c776e53fd8	c786a4c7-d707-4c6e-bd60-07c776e53fd8	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-11-25 20:17:08.483869
7729a41c-7709-4972-a439-ccefc2c7de54	\N	b8ab5ed9-0a90-4fd5-b3c2-732d4b7876f2	b8ab5ed9-0a90-4fd5-b3c2-732d4b7876f2	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-12-03 18:35:33.197725
86ab0447-119e-4690-9c92-4731409d6138	\N	7819ab8e-a76d-45ac-8e99-ed337693d0eb	7819ab8e-a76d-45ac-8e99-ed337693d0eb	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-12-05 18:08:43.600654
0d74a3f6-0f54-40fc-9af9-8c9afd529e2a	\N	1c8ca7f6-6bb6-4825-84b5-97bc5f15c202	1c8ca7f6-6bb6-4825-84b5-97bc5f15c202	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-12-17 05:17:23.315389
418440f1-6b85-45e5-a900-ebda1ba0cab4	\N	cba7c48f-dd6e-48a4-b0fd-53e8dbeefc06	cba7c48f-dd6e-48a4-b0fd-53e8dbeefc06	inbox	Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!	2025-12-19 17:25:53.404798
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, user_id, type, channel, title, body, metadata, is_read, sent_at, read_at) FROM stdin;
\.


--
-- Data for Name: partner_clicks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.partner_clicks (id, partner_id, user_id, clicked_at) FROM stdin;
0f1fd45b-35fb-4571-be05-c7d2f27f98b8	4403bfc6-9458-470f-b53c-c8b3617f786a	49819811	2025-11-25 22:22:26.875307
0ec4d420-ebd5-478f-9c17-f10150d66799	4403bfc6-9458-470f-b53c-c8b3617f786a	49819811	2025-12-01 16:03:39.155518
2bee063e-7e09-4e37-b3fa-5ee8ef098b72	4403bfc6-9458-470f-b53c-c8b3617f786a	49819811	2025-12-06 17:23:01.692167
840300dd-2df8-4fe0-8c65-1e68305241c2	cf7d70a1-e8eb-4344-aba8-2acf220bb7e8	49819811	2025-12-06 17:23:07.253979
ca22c059-6586-495d-adaf-80d84b400298	4403bfc6-9458-470f-b53c-c8b3617f786a	49819811	2025-12-06 17:23:14.802773
8ef103fa-6e07-41c9-b6d2-764b18c616b0	cf7d70a1-e8eb-4344-aba8-2acf220bb7e8	1c8ca7f6-6bb6-4825-84b5-97bc5f15c202	2025-12-17 11:49:31.8444
eb339941-0913-4c13-aef4-25082b418d12	cf7d70a1-e8eb-4344-aba8-2acf220bb7e8	cba7c48f-dd6e-48a4-b0fd-53e8dbeefc06	2025-12-19 17:34:51.59793
\.


--
-- Data for Name: partners; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.partners (id, name, description, category, affiliate_link, commission_rate, logo_url, color, is_active, created_at, updated_at) FROM stdin;
b000c6c5-f5ea-4583-84a9-51f82e6aa0e0	Autoport NG	Your online car booking platform 	Travel	https://www.autoport.ng		/uploads/partners/partner-1765048005275-207273072.png	from-green-500 to-teal-500	1	2025-11-24 21:20:06.252665	2025-12-06 19:06:45.327
4403bfc6-9458-470f-b53c-c8b3617f786a	Serenique Luxury Travel	Every mile, a masterpiece	Travel	https://tobitijani.inteletravel.uk		/uploads/partners/partner-1765134527818-788546194.jpeg	from-green-500 to-teal-500	1	2025-11-24 21:21:48.400123	2025-12-07 19:08:47.865
cf7d70a1-e8eb-4344-aba8-2acf220bb7e8	AlgoAI 	Giftcards, Rechargecards, Data	Utility	https://autoport.com		/uploads/partners/partner-1765134538663-635958153.png	from-blue-500 to-cyan-500	1	2025-11-24 21:20:15.383669	2025-12-07 19:08:58.716
\.


--
-- Data for Name: payment_receipts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.payment_receipts (id, group_id, member_id, uploaded_by, cycle_number, receipt_url, file_size, uploaded_at) FROM stdin;
\.


--
-- Data for Name: pot_transactions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pot_transactions (id, pot_id, user_id, amount, currency, type, created_at) FROM stdin;
\.


--
-- Data for Name: savings_pots; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.savings_pots (id, user_id, name, balance_ngn, balance_gbp, balance_usd, balance_eur, created_at) FROM stdin;
a717f3d8-4de1-4a12-94cc-ab46dd73765d	49819811	Test	0.00	0.00	0.00	0.00	2025-11-25 08:53:33.102031
59090904-f18d-438e-88d6-09fc7fd2b374	49819811	Test Pot	0.00	0.00	0.00	0.00	2025-12-29 15:12:48.14106
c7328de6-931c-4b73-8967-745446753de1	b8ab5ed9-0a90-4fd5-b3c2-732d4b7876f2	Emergency Pot	0.00	0.00	0.00	0.00	2025-12-29 15:22:36.543533
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
03DRC8l5j5er4I9st6C-uH8hHvWJzfYa	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T20:23:26.965Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6bcbf000-553a-4a0a-bc21-e65694738e8d", "exp": 1763670197, "iat": 1763666597, "iss": "https://replit.com/oidc", "sub": "49869831", "email": "t.girl4rill@yahoo.com", "at_hash": "Y0NNhPRGeXvLqzZQyU8Ssw", "username": "tgirl4rill", "auth_time": 1763666597, "last_name": null, "first_name": null}, "expires_at": 1763670197, "access_token": "2eC_nwah_yTld2PGdDnM3DR1_Q1Wo2U1I3egOLM89-s", "refresh_token": "DLNPvY0zWghZSBcTKB6U3o6sTomVXKaUUYuJcESiAGM"}}, "replit.com": {"code_verifier": "heIVzfrEamkh_iMwvX3CL7W2L4PpiO-KFHj-inmd3VA"}}	2025-11-28 09:19:19
8n0nN2XfP8WpyLeRmBEaAWK4ehN35MdI	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T17:35:54.619Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "YlzAoSA8uARC0i3Lg0jxYmT1aYcixAITO3Mh04qC2Ww"}}	2025-11-27 17:35:55
-XgmZkYx2Uj7AZ47f67jn4YbR73VoeyS	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T15:32:59.408Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "0fT_eTD_34fU7Ti1af4yinkNZxWpPygntUMbpOenkx4"}}	2025-11-28 17:28:41
fKPwCEULL6sGrmIANskAPCphYh-Kpjgb	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-25T23:05:00.754Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "R5g8LeaJpQxHoEhmrzAYKZdu6cX3xKWpRLTbe2Gg7v4"}}	2025-11-25 23:05:01
sOS-tdS7E7bT8Fy1jmH7A0nONhs_qBCW	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-26T17:19:12.342Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "1dccc662-8590-47ab-9e62-898df8b0e12f", "exp": 1763576351, "iat": 1763572751, "iss": "https://replit.com/oidc", "sub": "49819811", "email": "afolinks@outlook.com", "at_hash": "vz52IvP2POH-7ixQbzvIvA", "username": "afolinks", "auth_time": 1763483440, "last_name": null, "first_name": null}, "expires_at": 1763576351, "access_token": "XgJ-pmCCLzbSCs3mxRyESPR0yDmYSgxMiBkKsUBXq0u", "refresh_token": "H-HzAgolV0U-Lciyu9tmrlFKinht0hfzGSWxquTKZHV"}}}	2025-11-26 17:19:13
3-7cRpGfC0DqeYFdvo_v1IO27Lif3E9s	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T20:20:37.439Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-11-27 20:20:38
uzIVlMlsN-GHsQ0baABLSe9xXiuWpLQp	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T10:51:40.504Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "zkyJxJvc2Tuc5z2Imfymd8YYaVBMzOIrIq_7JATe4X8"}}	2025-11-27 18:20:07
Aqq3Au0kNIjpT1Z-iam-Ae6av4X8YZTS	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T15:51:54.678Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "d82f55b5-ab8d-4264-b700-0711aa612daa", "exp": 1763657514, "iat": 1763653914, "iss": "https://replit.com/oidc", "sub": "49819811", "email": "afolinks@outlook.com", "at_hash": "Ghm4Q_WdygIx6p2C5RxTMA", "username": "afolinks", "auth_time": 1763653913, "last_name": null, "first_name": null}, "expires_at": 1763657514, "access_token": "61T11jWM18ycJKkjbqFhGPf5BpLn1at4ZfVBMzpScS8", "refresh_token": "ubmwPlO0JF_NVeDFjbYXuKLA1chbx_Y3DkUYYkxQSH5"}}}	2025-11-28 16:29:34
gXKeNnFW1bfAf3UWA9vCiM1lZVfoAq3X	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T14:52:02.912Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "AN-ZzEv2bnLHFHn0AnAi6gEHv_fCYe_6_rivCWEku5E"}}	2025-11-27 14:52:03
D17vWf2ZpaO6vqLWoZerKhAeJpXhw9G9	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T17:44:20.393Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "AtOZ5iwegFvWFvGAhsKTRRp2pE_JPPoCOzBH66Jx0_Q"}}	2025-11-27 17:44:21
LvM5ygs29UnXq6D0_fkYDZJElX3YAdNf	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T20:20:47.098Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "k8MkTzEZqql_NCTPgis9kiweMa1COf9gthtQA6vRULk"}}	2025-11-28 17:48:07
-I1bnII7qgITSUBgD9rh-QnP4ZDzsroT	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T18:20:27.984Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "5ab0c018-d5c1-476c-a660-7416672722fe", "exp": 1763666427, "iat": 1763662827, "iss": "https://replit.com/oidc", "sub": "49949376", "email": "gbend007@gmail.com", "at_hash": "ybYce6yBKok5JbURoNvCmA", "username": "gbend007", "auth_time": 1763662827, "last_name": null, "first_name": null}, "expires_at": 1763666427, "access_token": "4RqHSQDOmm8dQrq08pFYY5gP63g_wGe3lPvcTQOHQ5E", "refresh_token": "v8crPRz7u34EY9xh0ISvFZIjRncvbHj_fMM2Ujp8nbs"}}}	2025-11-27 18:21:39
XUlsCG_AVWZZiPHAxGHPHOZAHMnAA2F3	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-27T18:24:13.837Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "5ab0c018-d5c1-476c-a660-7416672722fe", "exp": 1763666653, "iat": 1763663053, "iss": "https://replit.com/oidc", "sub": "49965980", "email": "afolashadenifemi26@gmail.com", "at_hash": "_U5xOBxHRS-4I4BwKLiHXg", "username": "afolashadenifem", "auth_time": 1763663052, "last_name": null, "first_name": null}, "expires_at": 1763666653, "access_token": "8L7Mq3Tm8P_ncz8AnlZFDF_z0eVdU95PtgaCiF71t0O", "refresh_token": "Ot5AYr870D0-Nl1cGPkXrdVXM6Wx-eBNMBRSEaYqYSq"}}}	2025-11-27 18:29:13
\.


--
-- Data for Name: user_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_settings (id, user_id, theme, inactivity_timeout_enabled, inactivity_timeout_minutes, biometric_enabled, push_notifications_enabled, email_notifications_enabled, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, first_name, last_name, profile_image_url, created_at, updated_at, phone, about_me, local_bank_account_name, local_bank_account_number, local_bank_name, international_bank_account_name, international_bank_account_number, international_bank_swift_code, international_bank_iban, preferred_name, local_bank_sort_code, is_admin, status, deleted_at, restricted_until, avatar_choice, gender, deletion_count, password_hash, auth_provider, auth_provider_id, password_reset_token, password_reset_expires, total_funds_ngn, total_funds_gbp, total_funds_usd, total_funds_eur, clerk_user_id) FROM stdin;
d288a950-84af-4c49-a071-fa170bdc8c48	olabodeoyeyemi@yahoo.com	Olabode 	Oyeyemi 	\N	2025-11-24 19:28:34.078654	2025-12-31 14:33:21.77	+2347018002750	\N	Olabode Oyeyemi 	0034745877	Gtbank 	\N	\N	\N	\N	Olabode	\N	0	active	\N	\N	male-1	male	0	$2b$10$MfX/kS2u9Fz2aqU95O63tem9aRB3/w6u9bhQK8KKeDCF8RWfwae3q	email	\N	\N	\N	0.00	0.00	0.00	0.00	user_37c9frtEUsYf2KGuP5CfsDm7IxW
51a29157-c2e4-4b51-8c2c-1cfb6d091ca6	zainabolamide275@gmail.com	Olamide 	Zainab 		2025-11-25 19:15:55.114534	2025-11-25 19:18:34.437	09161924315	I don’t cause problem am a easy\ngoing person 	Zainab olamide kaka 	7051758967	Opay	Zainab olamide kaka	7051758967	\N	\N	Ola	\N	0	active	\N	\N	female-2	female	0	$2b$10$AY8CXf6bYI21V7Od/6IRseh0ADbkxeppDsGdVI4OIwI6schLpsAyC	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
4f5c043b-6882-448d-a638-071c81802d9e	cuttiedupsy07@gmail.com	Modupeola	Adewunmi		2025-11-25 06:15:33.5196	2025-12-29 13:01:47.608	07081301987	\N	\N	\N	\N	\N	\N	\N	\N	Modupeola	\N	0	active	\N	\N		female	0	$2b$10$ltEFnsLEz5EubXlBAkSf9OQlF6JVYRLN0/TUmrGtMBQ.c3rVezOfy	email	\N	\N	\N	0.00	0.00	0.00	0.00	user_37WKHe0CJuy2kYjuRmwZH9zZ5jQ
fe5409f9-f401-4b74-9fbd-d8aefd19cacb	ruthkorede12@gmail.com	Korede	Afolabi	\N	2025-11-21 10:11:01.501209	2025-11-21 10:11:01.501209	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$qG/H3UGYtlImuqaU9HAA1O38n9mfmc.rkLQcd2Hcyy3RbE6qqD5nW	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
103a533f-c3ef-446e-9a2c-90a7602868d6	femi17609@gmail.com	Abdulhammed 	Iyanda	\N	2025-11-22 16:19:56.690305	2025-11-22 16:21:30.182	07459536090	\N	\N	\N	\N	\N	\N	\N	\N	Abdul	\N	0	active	\N	\N	male-4	male	0	$2b$10$AmsqAOTktmK8T3mwSfdRYOZWgKEm4OLR1I1gPMu/BEILWEFzskQAq	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
7819ab8e-a76d-45ac-8e99-ed337693d0eb	afolinks@gmail.com	Fola	AJ	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zNlI4Y2FMWjVhWEdMYm1SMm04cnVvTEhWcjEifQ	2025-12-05 18:08:43.534584	2025-12-05 18:08:43.534584	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	\N	clerk	\N	\N	\N	0.00	0.00	0.00	0.00	user_36R8cbT5wXjvzryC6yKOOZDfV7F
34bb4a68-2527-42b3-89b8-930bc1531f1f	kesingtonolutomi@myyahoo.com	Olutomi	Oluranti		2025-11-25 20:04:17.068017	2025-11-25 20:09:30.164	08050935286	I'm cool	\N	\N	\N	\N	\N	\N	\N	Olutomi	\N	0	active	\N	\N		female	0	$2b$10$lKWTnrTuHQOXfvq534QAzed7zwFlNb4mreTEit/9w0969bDE0gkHC	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
cba7c48f-dd6e-48a4-b0fd-53e8dbeefc06	justyojo@gmail.com	Folasade 	Adedoyin 	https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18zNkxuTnNkeTZRczhvd3RXc2NJaEx4SU5EZE4iLCJyaWQiOiJ1c2VyXzM3NGJBVEMwWWxxdENCcjl0WDBMdm0zaXppNiIsImluaXRpYWxzIjoiRkEifQ	2025-12-19 17:25:53.350237	2025-12-22 18:18:27.263	08025811796	Am a business woman	Adedoyin Folasade justinah 	0238005679	Wema	\N	\N	\N	\N	Justy	8636	0	active	\N	\N		female	0	\N	clerk	\N	\N	\N	0.00	0.00	0.00	0.00	user_374bATC0YlqtCBr9tX0Lvm3izi6
8ba73090-10e5-47ac-9737-95dff786f14e	dapzwalt@gmail.com	Adedapo	Adetunji		2025-11-24 10:57:57.582238	2025-12-17 10:12:58.158	+447765697530	I am Dapzwalt Omo ologo	Adedapo Walter Adetunji	0014941132	Gtbank	\N	\N	\N	\N	Walter	\N	0	active	\N	\N	male-2	male	0	$2b$10$uE4aYHyclbbLpLT7Lk355elJdRqA/6eVzbrrs45UFOavlO8wm924.	email	\N	\N	\N	0.00	0.00	0.00	0.00	user_36y6DS3aGUCoikOZspXU9Jn6s91
4ffefa15-91fc-4d5e-9927-70e96c98096e	rofiatomolara0@gmail.com	Rofiat	Kazeem	\N	2025-11-24 18:06:47.859315	2025-11-24 18:08:08.408	+2348169586445	\N	\N	\N	\N	\N	\N	\N	\N	Omolara	\N	0	active	\N	\N	female-4	female	0	$2b$10$lOEOXv3f9pHsecPwK46lt.uQA1We65SpC/.CgFG8lW4DxGLqe.nFi	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
8a282915-d781-46a8-b13a-1206a9d755ee	adejoke.biodun@gmail.com	abiodun	Sulaimon 	\N	2025-11-24 19:08:20.297932	2025-11-24 19:08:20.297932	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$kw94NQQdO9YTyxM/oy9odeYVP/IWppuz56E.KOYrCRbE/AIlbS4vW	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
b75b95a1-9a6e-4c71-8828-2a1faeeff3d3	nefisa.awoniyi@yahoo.com	Nefisa	Awoniyi	uploads/avatars/avatar-1764011761794-438028682.jpeg	2025-11-24 19:14:26.599324	2025-12-29 06:46:33.98	8165541794	\N	Awoniyi Ololade Nofisat 	0212901208 	Gtb bank 	\N	\N	\N	\N	Nefisa	\N	0	active	\N	\N	\N	female	0	$2b$10$9Tk1fiummzsYmQxqI7DwnujX4RdN7mQ8jzZFsUyPZWNzkR6I.jSI2	email	\N	\N	\N	0.00	0.00	0.00	0.00	user_37VaeucCr1p8aVy40wQRyYXTjfV
61af93e1-e004-4895-8434-da8d81fcaa79	odulanaadebusola@gmail.com	Odulana 	Adesewa 	/uploads/avatars/avatar-1764101388473-879686578.jpeg	2025-11-25 20:07:31.595548	2025-11-25 20:09:49.143	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N		\N	0	$2b$10$mpXTU52YFz6bPsqWXKPWVeAPyUd9lRXeZvF8oO6jlqBSVm7kygqUm	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
49819811	afolinks@outlook.com	Afolabi	Ajao		2025-11-18 02:14:21.811827	2025-12-29 15:20:46.918	+447846779604	\N	\N	\N	\N	\N	\N	\N	\N	Fola	\N	1	active	\N	\N	male-4	male	0	$2b$10$mVve5Sh2IuJIUd9m/kYku.Wm9MV2ouzn4KyiX.sKHA.vIknM5wSYm	apple	\N	\N	\N	0.00	0.00	0.00	0.00	user_36QFk7x2S81ObxEGx7azvymAcaF
0cbad486-8c35-4dae-8bc6-b545f43680ab	yusufola007@gmail.com	Yusuf	Akinsanya 	\N	2025-11-25 12:57:15.556562	2025-11-25 12:57:15.556562	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	$2b$10$U74mReC3eKHC.67ox/dPb.w3VsBOpUh8GbiQIe9vj4JcEhzLJpPnW	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
bc76b4c4-cb02-4a9e-834b-dd19837ad520	adeleyeoyinkansola10@gmail.com	Adeleye 	Omobolanle 		2025-11-25 19:07:33.194446	2025-12-31 11:55:09.057	09120369788	I'm a calm person I don't cause trouble 	Adeleye Oyinkansola omobolanle 	3217506309	First bank 	Adeleye Oyinkansola omobolanle 	3217506309	\N	\N	Oyinkansola 	\N	0	active	\N	\N	female-1	female	0	$2b$10$qJ2UUWnv/u2ZxlvTpDdzeeYYVBwnHPNkUdMC./ePOVI/wCVM97Hvu	email	\N	\N	\N	0.00	0.00	0.00	0.00	user_37bqQqotlzObKcFFu9eCZTVxF3D
49949376	gbend007@gmail.com	\N	\N	\N	2025-11-20 10:53:19.631885	2025-11-20 18:20:27.834	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	0.00	0.00	0.00	0.00	\N
49965980	afolashadenifemi26@gmail.com	Afolashade 	Adedayo	\N	2025-11-20 18:23:32.498526	2025-11-20 18:26:10.001	2348163767343	Nothing	\N	\N	\N	\N	\N	\N	\N	Sade baby	\N	0	active	\N	\N	female-4	female	0	\N	\N	\N	\N	\N	0.00	0.00	0.00	0.00	\N
8019b8c3-ffac-4403-a9c7-8da97f3a0201	t.girl4rill@yahoo.com	Tobi	T	\N	2025-11-23 21:20:01.387417	2025-12-05 12:44:49.866	+447531226814	\N	\N	\N	\N	\N	\N	\N	\N	Tobi	\N	0	active	\N	\N	female-1	female	0	$2b$10$CM.4CbyEwM/4.G/LfYfvG.f6D0V0fc698zMhOVvEmw4k5Fh3JrJSm	email	\N	\N	\N	0.00	0.00	0.00	0.00	user_36QVGUkY9Tnw6ME4CraNfn1W9n8
b8ab5ed9-0a90-4fd5-b3c2-732d4b7876f2	itteam@algoscapeinnovat.io			\N	2025-12-03 18:35:33.135257	2025-12-05 20:09:29.071	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	\N	apple		\N	\N	0.00	0.00	0.00	0.00	user_36LrofZUIyV9REEM4oBDGPctTGX
1c8ca7f6-6bb6-4825-84b5-97bc5f15c202	adeosunabosede083@gmail.com	Abosede	Adeosun	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zNnhXS1JLdmo4ZzJBRWJRQjdLRnhyZ3BmNEUifQ	2025-12-17 05:17:22.913682	2025-12-17 05:21:40.448	07011735100	Am humble and honest	8170954035	8170954035	0pay	\N	\N	\N	\N	Latexx 	\N	0	active	\N	\N		female	0	\N	clerk	\N	\N	\N	0.00	0.00	0.00	0.00	user_36xWKPL2azbj1B54O6V6RRWO712
737439f1-1be7-4609-8419-dde643af05f8	afolinks@hotmail.com	Afolabi	Ajao	\N	2025-11-21 03:49:30.050541	2025-11-21 03:49:55.738	+447846779604	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	male-4	male	0	$2b$10$EgJmvCEodhMiOno8/eeOX.PTHYh91AHzzMYKCB5Fx4sTnxHJFL0Bu	email	\N	\N	\N	0.00	0.00	0.00	0.00	\N
83cf805b-62e0-41b2-8aef-48502149ec65	deesevent1@yahoo.com	Damilola	Oyewusi	uploads/avatars/avatar-1764011355034-353641252.jpeg	2025-11-24 06:05:25.016061	2025-12-22 20:47:07.687	08058874995	My name is Damilola Oyewusi. I was born 31/3/1990, a mother of 2 beautiful smart girls.	Damilola Oyewusi 	0151662062	Gt bank 	Damilola Oyewusi 	0151662062	0151662062	\N	\N	042909	0	active	\N	\N	female-1	female	0	$2b$10$5QXgRw4LdKU8uXV.xB8ZvezNLrSINO2zUQQenY2MVj52/QNZAYtRi	email	\N	\N	\N	0.00	0.00	0.00	0.00	user_37DT1NfF7njiYg76hjwKOhuXuQ9
49946820	kayustola@yahoo.com	\N	\N	\N	2025-11-20 09:30:39.522976	2025-12-21 23:15:20.777	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	active	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	0.00	0.00	0.00	0.00	user_37Avv169x3GpGkltWoi5IHS4yNu
c786a4c7-d707-4c6e-bd60-07c776e53fd8	lolaojebode@gmail.com	Omolola	Ojebode		2025-11-25 20:17:08.424807	2025-12-30 21:47:06.288	08035255760	I am a friendly and focused person who is always committed to improving myself and supporting others.\n\n	Ojebode Omolola Funmilola 	0013358700	Guaranty Trust Bank 	\N	\N	\N	\N	Lola	\N	0	active	\N	\N	female-2	female	0	$2b$10$8qxB6D.2uazeoGneL.NZ7ejV7Jl49Xzz682ZEZ2vEHIHPZNcdz9Nu	email	\N	\N	\N	0.00	0.00	0.00	0.00	user_37aBIjSKOy8YELybpcKLjRqPLKB
\.


--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE SET; Schema: _system; Owner: neondb_owner
--

SELECT pg_catalog.setval('_system.replit_database_migrations_v1_id_seq', 14, true);


--
-- Name: replit_database_migrations_v1 replit_database_migrations_v1_pkey; Type: CONSTRAINT; Schema: _system; Owner: neondb_owner
--

ALTER TABLE ONLY _system.replit_database_migrations_v1
    ADD CONSTRAINT replit_database_migrations_v1_pkey PRIMARY KEY (id);


--
-- Name: audit_events audit_events_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_events
    ADD CONSTRAINT audit_events_pkey PRIMARY KEY (id);


--
-- Name: contributions contributions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT contributions_pkey PRIMARY KEY (id);


--
-- Name: data_exports data_exports_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.data_exports
    ADD CONSTRAINT data_exports_pkey PRIMARY KEY (id);


--
-- Name: device_tokens device_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: invite_links invite_links_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invite_links
    ADD CONSTRAINT invite_links_pkey PRIMARY KEY (id);


--
-- Name: invite_links invite_links_token_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invite_links
    ADD CONSTRAINT invite_links_token_unique UNIQUE (token);


--
-- Name: join_requests join_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.join_requests
    ADD CONSTRAINT join_requests_pkey PRIMARY KEY (id);


--
-- Name: members members_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: partner_clicks partner_clicks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.partner_clicks
    ADD CONSTRAINT partner_clicks_pkey PRIMARY KEY (id);


--
-- Name: partners partners_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_pkey PRIMARY KEY (id);


--
-- Name: payment_receipts payment_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_receipts
    ADD CONSTRAINT payment_receipts_pkey PRIMARY KEY (id);


--
-- Name: pot_transactions pot_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pot_transactions
    ADD CONSTRAINT pot_transactions_pkey PRIMARY KEY (id);


--
-- Name: savings_pots savings_pots_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.savings_pots
    ADD CONSTRAINT savings_pots_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_unique UNIQUE (user_id);


--
-- Name: users users_clerk_user_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_clerk_user_id_key UNIQUE (clerk_user_id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_replit_database_migrations_v1_build_id; Type: INDEX; Schema: _system; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_replit_database_migrations_v1_build_id ON _system.replit_database_migrations_v1 USING btree (build_id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: idx_audit_events_action; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_audit_events_action ON public.audit_events USING btree (action, created_at);


--
-- Name: idx_audit_events_actor; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_audit_events_actor ON public.audit_events USING btree (actor_id, created_at);


--
-- Name: idx_audit_events_target; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_audit_events_target ON public.audit_events USING btree (target_user_id, created_at);


--
-- Name: idx_data_exports_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_data_exports_status ON public.data_exports USING btree (status);


--
-- Name: idx_data_exports_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_data_exports_user ON public.data_exports USING btree (user_id);


--
-- Name: idx_device_tokens_active; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_device_tokens_active ON public.device_tokens USING btree (is_active);


--
-- Name: idx_device_tokens_token; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_device_tokens_token ON public.device_tokens USING btree (token);


--
-- Name: idx_device_tokens_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_device_tokens_user ON public.device_tokens USING btree (user_id);


--
-- Name: idx_groups_created; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_groups_created ON public.groups USING btree (created_at);


--
-- Name: idx_groups_currency; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_groups_currency ON public.groups USING btree (currency);


--
-- Name: idx_groups_frequency; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_groups_frequency ON public.groups USING btree (frequency);


--
-- Name: idx_groups_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_groups_status ON public.groups USING btree (status);


--
-- Name: idx_join_requests_group; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_join_requests_group ON public.join_requests USING btree (group_id, status);


--
-- Name: idx_join_requests_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_join_requests_user ON public.join_requests USING btree (user_id, status);


--
-- Name: idx_messages_group_created; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_messages_group_created ON public.messages USING btree (group_id, created_at);


--
-- Name: idx_messages_recipient_created; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_messages_recipient_created ON public.messages USING btree (recipient_id, created_at);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_sent; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notifications_sent ON public.notifications USING btree (sent_at);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);


--
-- Name: idx_partner_clicks_date; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_partner_clicks_date ON public.partner_clicks USING btree (clicked_at);


--
-- Name: idx_partner_clicks_partner; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_partner_clicks_partner ON public.partner_clicks USING btree (partner_id);


--
-- Name: idx_partner_clicks_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_partner_clicks_user ON public.partner_clicks USING btree (user_id);


--
-- Name: idx_partners_active; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_partners_active ON public.partners USING btree (is_active);


--
-- Name: idx_partners_category; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_partners_category ON public.partners USING btree (category);


--
-- Name: idx_pot_transactions_pot; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pot_transactions_pot ON public.pot_transactions USING btree (pot_id, created_at);


--
-- Name: idx_pot_transactions_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pot_transactions_user ON public.pot_transactions USING btree (user_id, created_at);


--
-- Name: idx_pots_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pots_user ON public.savings_pots USING btree (user_id);


--
-- Name: idx_receipts_group_cycle; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_receipts_group_cycle ON public.payment_receipts USING btree (group_id, cycle_number);


--
-- Name: idx_receipts_member; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_receipts_member ON public.payment_receipts USING btree (member_id);


--
-- Name: idx_user_settings_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_settings_user ON public.user_settings USING btree (user_id);


--
-- Name: idx_users_created; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_users_created ON public.users USING btree (created_at);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--
-- Name: audit_events audit_events_actor_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_events
    ADD CONSTRAINT audit_events_actor_id_users_id_fk FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: audit_events audit_events_target_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_events
    ADD CONSTRAINT audit_events_target_user_id_users_id_fk FOREIGN KEY (target_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: contributions contributions_group_id_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT contributions_group_id_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: contributions contributions_member_id_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT contributions_member_id_members_id_fk FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: data_exports data_exports_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.data_exports
    ADD CONSTRAINT data_exports_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: device_tokens device_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: groups groups_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: invite_links invite_links_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invite_links
    ADD CONSTRAINT invite_links_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: invite_links invite_links_group_id_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invite_links
    ADD CONSTRAINT invite_links_group_id_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: join_requests join_requests_group_id_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.join_requests
    ADD CONSTRAINT join_requests_group_id_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: join_requests join_requests_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.join_requests
    ADD CONSTRAINT join_requests_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: members members_group_id_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_group_id_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: members members_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: messages messages_group_id_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_group_id_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: messages messages_recipient_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_recipient_id_users_id_fk FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: partner_clicks partner_clicks_partner_id_partners_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.partner_clicks
    ADD CONSTRAINT partner_clicks_partner_id_partners_id_fk FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;


--
-- Name: partner_clicks partner_clicks_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.partner_clicks
    ADD CONSTRAINT partner_clicks_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payment_receipts payment_receipts_group_id_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_receipts
    ADD CONSTRAINT payment_receipts_group_id_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: payment_receipts payment_receipts_member_id_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_receipts
    ADD CONSTRAINT payment_receipts_member_id_members_id_fk FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: payment_receipts payment_receipts_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_receipts
    ADD CONSTRAINT payment_receipts_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: pot_transactions pot_transactions_pot_id_savings_pots_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pot_transactions
    ADD CONSTRAINT pot_transactions_pot_id_savings_pots_id_fk FOREIGN KEY (pot_id) REFERENCES public.savings_pots(id) ON DELETE CASCADE;


--
-- Name: pot_transactions pot_transactions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pot_transactions
    ADD CONSTRAINT pot_transactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: savings_pots savings_pots_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.savings_pots
    ADD CONSTRAINT savings_pots_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_settings user_settings_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict EW9tG7SJizV6ry9w2olC3hATHmCfzasXK89oqzlgb8QHBKxrULkt4r9GMeLlZ28

